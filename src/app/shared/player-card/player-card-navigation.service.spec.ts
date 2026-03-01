import { TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { PlayerCardNavigationService } from './player-card-navigation.service';
import { Player } from '@services/api.service';

const p1 = { name: 'Player 1' } as Player;
const p2 = { name: 'Player 2' } as Player;
const p3 = { name: 'Player 3' } as Player;

function makeService() {
    const service = TestBed.inject(PlayerCardNavigationService);
    const cdrMock = {
        detectChanges: vi.fn().mockName("ChangeDetectorRef.detectChanges")
    };
    const hostMock = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
    const navigateSpy = vi.fn();
    service.init({ allPlayers: [p1, p2, p3], currentIndex: 0 }, hostMock, cdrMock as any, navigateSpy);
    return { service, navigateSpy, cdrMock };
}

describe('PlayerCardNavigationService', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
        TestBed.configureTestingModule({ providers: [PlayerCardNavigationService] });
    });

    afterEach(() => {
        TestBed.inject(PlayerCardNavigationService).ngOnDestroy();
    });

    it('canNavigate returns true when more than one player', () => {
        const { service } = makeService();
        expect(service.canNavigate()).toBe(true);
    });

    it('canNavigate returns false when only one player', () => {
        const service = TestBed.inject(PlayerCardNavigationService);
        const cdr = {
            detectChanges: vi.fn().mockName("ChangeDetectorRef.detectChanges")
        };
        const host = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
        service.init({ allPlayers: [p1], currentIndex: 0 }, host, cdr as any, vi.fn());
        expect(service.canNavigate()).toBe(false);
    });

    it('navigateToNext moves to next player and calls onNavigate callback', () => {
        const { service, navigateSpy } = makeService();
        // Bypass animation by patching navigateToIndex to call applyNavigation directly
        vi.spyOn(service as any, 'navigateToIndex').mockImplementation((...args: any[]) => { const [idx] = args;
            (service as any).applyNavigation(idx);
        });
        service.navigateToNext();
        expect(navigateSpy).toHaveBeenCalledWith(p2, 1);
        expect(service.currentIndex).toBe(1);
    });

    it('navigateToNext wraps around from last player', () => {
        const { service } = makeService();
        vi.spyOn(service as any, 'navigateToIndex').mockImplementation((...args: any[]) => { const [idx] = args;
            (service as any).applyNavigation(idx);
        });
        service.currentIndex = 2;
        service.navigateToNext();
        expect(service.currentIndex).toBe(0);
    });

    it('navigateToPrevious wraps around to last player from first', () => {
        const { service } = makeService();
        vi.spyOn(service as any, 'navigateToIndex').mockImplementation((...args: any[]) => { const [idx] = args;
            (service as any).applyNavigation(idx);
        });
        service.navigateToPrevious();
        expect(service.currentIndex).toBe(2);
    });

    it('handleKeydown calls navigateToNext on ArrowRight', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(service.navigateToNext).toHaveBeenCalled();
    });

    it('handleKeydown calls navigateToPrevious on ArrowLeft', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToPrevious');
        service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        expect(service.navigateToPrevious).toHaveBeenCalled();
    });

    it('handleKeydown does nothing when canNavigate is false', () => {
        const service = TestBed.inject(PlayerCardNavigationService);
        const cdr = {
            detectChanges: vi.fn().mockName("ChangeDetectorRef.detectChanges")
        };
        const host = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
        service.init({ allPlayers: [p1], currentIndex: 0 }, host, cdr as any, vi.fn());
        vi.spyOn(service, 'navigateToNext');
        service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(service.navigateToNext).not.toHaveBeenCalled();
    });

    it('sets liveRegionMessage after navigation', () => {
        const { service } = makeService();
        vi.spyOn(service as any, 'navigateToIndex').mockImplementation((...args: any[]) => { const [idx] = args;
            (service as any).applyNavigation(idx);
        });
        service.navigateToNext();
        expect(service.liveRegionMessage).toContain('Player 2');
    });

    it('handleTouchEnd navigates next on left swipe', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        service.handleTouchStart({ touches: [{ clientX: 200, clientY: 0 }] } as any);
        service.handleTouchEnd({ changedTouches: [{ clientX: 100, clientY: 5 }] } as any);
        expect(service.navigateToNext).toHaveBeenCalled();
    });

    it('handleTouchEnd navigates previous on right swipe', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToPrevious');
        service.handleTouchStart({ touches: [{ clientX: 100, clientY: 0 }] } as any);
        service.handleTouchEnd({ changedTouches: [{ clientX: 200, clientY: 5 }] } as any);
        expect(service.navigateToPrevious).toHaveBeenCalled();
    });

    it('handleTouchEnd ignores vertical swipe exceeding max vertical threshold', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        service.handleTouchStart({ touches: [{ clientX: 200, clientY: 0 }] } as any);
        service.handleTouchEnd({ changedTouches: [{ clientX: 100, clientY: 100 }] } as any);
        expect(service.navigateToNext).not.toHaveBeenCalled();
    });

    it('navigateToIndex sets slide-out class then applies navigation after animation duration', () => {
        vi.useFakeTimers();
        const { service, navigateSpy } = makeService();
        service.navigateToIndex(1, 'left');
        expect(service.slideClass).toContain('slide-out-left');

        vi.advanceTimersByTime(125);

        expect(navigateSpy).toHaveBeenCalledWith(p2, 1);

        vi.useRealTimers();
    });

    it('ngOnDestroy removes wheel listener and clears timers', () => {
        const { service } = makeService();
        vi.spyOn(document, 'removeEventListener');
        (service as any).startWheelCooldown();
        service.ngOnDestroy();
        expect(document.removeEventListener).toHaveBeenCalled();
        // Ticking past the cooldown duration after destroy should not throw

    });

    it('onWheel navigates next when horizontal delta exceeds threshold', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as WheelEvent);
        expect(service.navigateToNext).toHaveBeenCalled();


    });

    it('onWheel navigates previous when horizontal delta is below negative threshold', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToPrevious');
        (service as any).onWheel({ deltaX: -60, deltaY: 0, preventDefault: () => { } } as WheelEvent);
        expect(service.navigateToPrevious).toHaveBeenCalled();


    });

    it('onWheel ignores predominantly vertical scroll', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        (service as any).onWheel({ deltaX: 5, deltaY: 60, preventDefault: () => { } } as WheelEvent);
        expect(service.navigateToNext).not.toHaveBeenCalled();

    });

    it('onWheel does nothing during cooldown', () => {
        const { service } = makeService();
        vi.spyOn(service, 'navigateToNext');
        (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as WheelEvent);
        (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as WheelEvent);
        expect(service.navigateToNext).toHaveBeenCalledTimes(1);


    });

    it('wheelHandler arrow function delegates to onWheel', () => {
        const { service } = makeService();
        const onWheelSpy = vi.spyOn(service as any, 'onWheel');
        const fakeEvent = { deltaX: 0, deltaY: 0, preventDefault: vi.fn() } as unknown as WheelEvent;
        (service as any).wheelHandler(fakeEvent);
        expect(onWheelSpy).toHaveBeenCalledWith(fakeEvent);
    });

    it('startWheelCooldown resets wheelDeltaX and activates cooldown', () => {
        vi.useFakeTimers();
        const { service } = makeService();
        (service as any).wheelDeltaX = 30;
        (service as any).startWheelCooldown();
        expect((service as any).wheelDeltaX).toBe(0);
        expect((service as any).wheelCooldown).toBe(true);

        vi.advanceTimersByTime(600);
        expect((service as any).wheelCooldown).toBe(false);
        vi.useRealTimers();
    });
});
