import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { PlayerCardNavigationService } from './player-card-navigation.service';
import { Player } from '@services/api.service';

const p1 = { name: 'Player 1' } as Player;
const p2 = { name: 'Player 2' } as Player;
const p3 = { name: 'Player 3' } as Player;

function makeService() {
  const service = TestBed.inject(PlayerCardNavigationService);
  const cdrMock = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
  const hostMock = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
  const navigateSpy = jasmine.createSpy('onNavigate');
  service.init(
    { allPlayers: [p1, p2, p3], currentIndex: 0 },
    hostMock,
    cdrMock,
    navigateSpy,
  );
  return { service, navigateSpy, cdrMock };
}

describe('PlayerCardNavigationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlayerCardNavigationService] });
  });

  afterEach(() => {
    TestBed.inject(PlayerCardNavigationService).ngOnDestroy();
  });

  it('canNavigate returns true when more than one player', () => {
    const { service } = makeService();
    expect(service.canNavigate()).toBeTrue();
  });

  it('canNavigate returns false when only one player', () => {
    const service = TestBed.inject(PlayerCardNavigationService);
    const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    const host = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
    service.init({ allPlayers: [p1], currentIndex: 0 }, host, cdr, jasmine.createSpy());
    expect(service.canNavigate()).toBeFalse();
  });

  it('navigateToNext moves to next player and calls onNavigate callback', fakeAsync(() => {
    const { service, navigateSpy } = makeService();
    // Bypass animation by patching navigateToIndex to call applyNavigation directly
    spyOn<any>(service, 'navigateToIndex').and.callFake((idx: number) => {
      (service as any).applyNavigation(idx);
    });
    service.navigateToNext();
    expect(navigateSpy).toHaveBeenCalledWith(p2, 1);
    expect(service.currentIndex).toBe(1);
  }));

  it('navigateToNext wraps around from last player', fakeAsync(() => {
    const { service } = makeService();
    spyOn<any>(service, 'navigateToIndex').and.callFake((idx: number) => {
      (service as any).applyNavigation(idx);
    });
    service.currentIndex = 2;
    service.navigateToNext();
    expect(service.currentIndex).toBe(0);
  }));

  it('navigateToPrevious wraps around to last player from first', fakeAsync(() => {
    const { service } = makeService();
    spyOn<any>(service, 'navigateToIndex').and.callFake((idx: number) => {
      (service as any).applyNavigation(idx);
    });
    service.navigateToPrevious();
    expect(service.currentIndex).toBe(2);
  }));

  it('handleKeydown calls navigateToNext on ArrowRight', () => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(service.navigateToNext).toHaveBeenCalled();
  });

  it('handleKeydown calls navigateToPrevious on ArrowLeft', () => {
    const { service } = makeService();
    spyOn(service, 'navigateToPrevious');
    service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(service.navigateToPrevious).toHaveBeenCalled();
  });

  it('handleKeydown does nothing when canNavigate is false', () => {
    const service = TestBed.inject(PlayerCardNavigationService);
    const cdr = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    const host = { nativeElement: { querySelector: () => null } } as unknown as ElementRef;
    service.init({ allPlayers: [p1], currentIndex: 0 }, host, cdr, jasmine.createSpy());
    spyOn(service, 'navigateToNext');
    service.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(service.navigateToNext).not.toHaveBeenCalled();
  });

  it('sets liveRegionMessage after navigation', fakeAsync(() => {
    const { service } = makeService();
    spyOn<any>(service, 'navigateToIndex').and.callFake((idx: number) => {
      (service as any).applyNavigation(idx);
    });
    service.navigateToNext();
    expect(service.liveRegionMessage).toContain('Player 2');
  }));

  it('handleTouchEnd navigates next on left swipe', () => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    service.handleTouchStart({ touches: [{ clientX: 200, clientY: 0 }] } as any);
    service.handleTouchEnd({ changedTouches: [{ clientX: 100, clientY: 5 }] } as any);
    expect(service.navigateToNext).toHaveBeenCalled();
  });

  it('handleTouchEnd navigates previous on right swipe', () => {
    const { service } = makeService();
    spyOn(service, 'navigateToPrevious');
    service.handleTouchStart({ touches: [{ clientX: 100, clientY: 0 }] } as any);
    service.handleTouchEnd({ changedTouches: [{ clientX: 200, clientY: 5 }] } as any);
    expect(service.navigateToPrevious).toHaveBeenCalled();
  });

  it('handleTouchEnd ignores vertical swipe exceeding max vertical threshold', () => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    service.handleTouchStart({ touches: [{ clientX: 200, clientY: 0 }] } as any);
    service.handleTouchEnd({ changedTouches: [{ clientX: 100, clientY: 100 }] } as any);
    expect(service.navigateToNext).not.toHaveBeenCalled();
  });

  it('navigateToIndex sets slide-out class then applies navigation after animation duration', fakeAsync(() => {
    const { service, navigateSpy } = makeService();
    service.navigateToIndex(1, 'left');
    expect(service.slideClass).toContain('slide-out-left');
    tick(125);
    expect(navigateSpy).toHaveBeenCalledWith(p2, 1);
    tick(125);
  }));

  it('ngOnDestroy removes wheel listener and clears timers', () => {
    const { service } = makeService();
    spyOn(document, 'removeEventListener');
    service.ngOnDestroy();
    expect(document.removeEventListener).toHaveBeenCalled();
  });

  it('onWheel navigates next when horizontal delta exceeds threshold', fakeAsync(() => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => {} } as WheelEvent);
    expect(service.navigateToNext).toHaveBeenCalled();
    tick(500); // clear cooldown
    tick(200); // clear reset timer
  }));

  it('onWheel navigates previous when horizontal delta is below negative threshold', fakeAsync(() => {
    const { service } = makeService();
    spyOn(service, 'navigateToPrevious');
    (service as any).onWheel({ deltaX: -60, deltaY: 0, preventDefault: () => {} } as WheelEvent);
    expect(service.navigateToPrevious).toHaveBeenCalled();
    tick(500);
    tick(200);
  }));

  it('onWheel ignores predominantly vertical scroll', fakeAsync(() => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    (service as any).onWheel({ deltaX: 5, deltaY: 60, preventDefault: () => {} } as WheelEvent);
    expect(service.navigateToNext).not.toHaveBeenCalled();
    tick(200);
  }));

  it('onWheel does nothing during cooldown', fakeAsync(() => {
    const { service } = makeService();
    spyOn(service, 'navigateToNext');
    (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => {} } as WheelEvent);
    (service as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => {} } as WheelEvent);
    expect(service.navigateToNext).toHaveBeenCalledTimes(1);
    tick(500);
    tick(200);
  }));

  it('startWheelCooldown resets wheelDeltaX and activates cooldown', fakeAsync(() => {
    const { service } = makeService();
    (service as any).wheelDeltaX = 30;
    (service as any).startWheelCooldown();
    expect((service as any).wheelDeltaX).toBe(0);
    expect((service as any).wheelCooldown).toBeTrue();
    tick(500);
    expect((service as any).wheelCooldown).toBeFalse();
  }));
});
