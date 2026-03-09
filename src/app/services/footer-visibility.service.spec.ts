import { TestBed } from '@angular/core/testing';

import {
  FooterVisibilityService,
  FOOTER_VISIBILITY_FALLBACK_MS,
} from './footer-visibility.service';

describe('FooterVisibilityService', () => {
  let service: FooterVisibilityService;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [FooterVisibilityService],
    });

    service = TestBed.inject(FooterVisibilityService);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('starts hidden and becomes visible after the fallback delay', () => {
    expect(service.footerVisible()).toBe(false);

    vi.advanceTimersByTime(FOOTER_VISIBILITY_FALLBACK_MS - 1);
    expect(service.footerVisible()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(service.footerVisible()).toBe(true);
  });

  it('shows the footer immediately when the current navigation cycle is marked ready', () => {
    const cycle = service.currentCycle();

    service.markReady(cycle);

    expect(service.footerVisible()).toBe(true);

    vi.advanceTimersByTime(FOOTER_VISIBILITY_FALLBACK_MS);
    expect(service.footerVisible()).toBe(true);
  });

  it('ignores ready signals from older navigation cycles', () => {
    const initialCycle = service.currentCycle();

    service.markReady(initialCycle);
    expect(service.footerVisible()).toBe(true);

    const currentCycle = service.beginNavigation();
    expect(service.footerVisible()).toBe(false);

    service.markReady(initialCycle);
    expect(service.footerVisible()).toBe(false);

    service.markReady(currentCycle);
    expect(service.footerVisible()).toBe(true);
  });
});
