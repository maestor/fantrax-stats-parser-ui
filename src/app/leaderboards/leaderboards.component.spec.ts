import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { LeaderboardsComponent } from './leaderboards.component';

describe('LeaderboardsComponent', () => {
  function createComponent(initialUrl = '/leaderboards/regular') {
    const events$ = new Subject<unknown>();
    const router = {
      events: events$.asObservable(),
      url: initialUrl,
    };
    const detectChanges = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ChangeDetectorRef, useValue: { detectChanges } },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new LeaderboardsComponent());

    return { component, detectChanges, events$, router };
  }

  it('tracks the active leaderboard tab from the current route and router events', () => {
    const { component, detectChanges, events$, router } = createComponent('/leaderboards/regular?foo=1');

    component.ngOnInit();

    expect(component.activeLink).toBe('/leaderboards/regular');

    router.url = '/leaderboards/transfers?bar=1';
    events$.next({});

    expect(component.activeLink).toBe('/leaderboards/transfers');
    expect(detectChanges).toHaveBeenCalledTimes(1);
  });
});
