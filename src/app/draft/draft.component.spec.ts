import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

import { DraftComponent } from './draft.component';

describe('DraftComponent', () => {
  function createComponent(initialUrl = '/draft/entry-drafts') {
    const events$ = new Subject<unknown>();
    const router = {
      events: events$.asObservable(),
      url: initialUrl,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: router }],
    });

    const component = TestBed.runInInjectionContext(() => new DraftComponent());

    return { component, events$, router };
  }

  it('tracks the active draft tab from the current route and router events', () => {
    const { component, events$, router } = createComponent('/draft/entry-drafts?foo=1');

    expect(component.activeLink).toBe('/draft/entry-drafts');

    router.url = '/draft/opening-draft?bar=1';
    events$.next({});

    expect(component.activeLink).toBe('/draft/opening-draft');

    router.url = '/draft/statistics?page=2';
    events$.next({});

    expect(component.activeLink).toBe('/draft/statistics');
  });
});
