import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  let breakpointState$: Subject<BreakpointState>;
  let service: ViewportService;

  beforeEach(() => {
    breakpointState$ = new Subject<BreakpointState>();

    TestBed.configureTestingModule({
      providers: [
        ViewportService,
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn(() => breakpointState$.asObservable()),
          },
        },
      ],
    });

    service = TestBed.inject(ViewportService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('maps breakpoint matches to the mobile flag', () => {
    const received: boolean[] = [];
    service.isMobile$.subscribe((value) => received.push(value));

    breakpointState$.next({ matches: false, breakpoints: {} });
    breakpointState$.next({ matches: true, breakpoints: {} });

    expect(received).toEqual([false, true]);
  });

  it('replays the latest mobile state to late subscribers', () => {
    const firstSubscriber: boolean[] = [];
    const secondSubscriber: boolean[] = [];

    service.isMobile$.subscribe((value) => firstSubscriber.push(value));
    breakpointState$.next({ matches: true, breakpoints: {} });

    service.isMobile$.subscribe((value) => secondSubscriber.push(value));

    expect(firstSubscriber).toEqual([true]);
    expect(secondSubscriber).toEqual([true]);
  });
});
