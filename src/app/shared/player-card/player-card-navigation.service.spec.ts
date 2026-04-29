import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent } from '@testing-library/angular';

import { PlayerCardNavigationService } from './player-card-navigation.service';

describe('PlayerCardNavigationService', () => {
  const activeServices: PlayerCardNavigationService[] = [];

  function preferReducedMotion(): void {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  function setup(currentIndex = 0) {
    preferReducedMotion();

    const service = TestBed.runInInjectionContext(() => new PlayerCardNavigationService());
    const cdr = { detectChanges: vi.fn() } as unknown as ChangeDetectorRef;
    const players = [
      { name: 'Player A' },
      { name: 'Player B' },
      { name: 'Player C' },
    ] as never[];
    const contextNavigate = vi.fn();
    const onNavigate = vi.fn();

    service.init(
      {
        allPlayers: players,
        currentIndex,
        onNavigate: contextNavigate,
      },
      cdr,
      onNavigate,
    );
    activeServices.push(service);

    return {
      cdr,
      contextNavigate,
      onNavigate,
      players,
      service,
    };
  }

  afterEach(() => {
    activeServices.splice(0).forEach((service) => {
      service.ngOnDestroy();
    });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('wraps keyboard navigation and announces the active player without animation for reduced-motion users', () => {
    const { contextNavigate, onNavigate, players, service } = setup();

    const previousEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      cancelable: true,
    });
    service.handleKeydown(previousEvent);

    expect(previousEvent.defaultPrevented).toBe(true);
    expect(contextNavigate).toHaveBeenLastCalledWith(2);
    expect(onNavigate).toHaveBeenLastCalledWith(players[2], 2);
    expect(service.liveRegionMessage).toBe('Pelaaja 3 / 3: Player C');
    expect(service.slideClass).toBe('');

    const nextEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      cancelable: true,
    });
    service.handleKeydown(nextEvent);

    expect(nextEvent.defaultPrevented).toBe(true);
    expect(contextNavigate).toHaveBeenLastCalledWith(0);
    expect(onNavigate).toHaveBeenLastCalledWith(players[0], 0);
    expect(service.liveRegionMessage).toBe('Pelaaja 1 / 3: Player A');
  });

  it('uses horizontal wheel gestures for one navigation step at a time', () => {
    vi.useFakeTimers();
    const { onNavigate, players, service } = setup();

    fireEvent.wheel(document, { deltaX: 120, deltaY: 0 });

    expect(onNavigate).toHaveBeenLastCalledWith(players[1], 1);
    expect(service.liveRegionMessage).toBe('Pelaaja 2 / 3: Player B');

    fireEvent.wheel(document, { deltaX: 120, deltaY: 0 });
    expect(onNavigate).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    fireEvent.wheel(document, { deltaX: -120, deltaY: 0 });

    expect(onNavigate).toHaveBeenLastCalledWith(players[0], 0);
    expect(service.liveRegionMessage).toBe('Pelaaja 1 / 3: Player A');
  });

  it('supports horizontal touch navigation while ignoring mostly vertical swipes', () => {
    const { onNavigate, players, service } = setup(1);

    service.handleTouchStart({
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as TouchEvent);
    service.handleTouchEnd({
      changedTouches: [{ clientX: 180, clientY: 105 }],
    } as unknown as TouchEvent);

    expect(onNavigate).toHaveBeenLastCalledWith(players[0], 0);
    expect(service.liveRegionMessage).toBe('Pelaaja 1 / 3: Player A');

    service.handleTouchStart({
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as TouchEvent);
    service.handleTouchEnd({
      changedTouches: [{ clientX: 20, clientY: 220 }],
    } as unknown as TouchEvent);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
