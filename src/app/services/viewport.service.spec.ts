import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { firstValueFrom, of } from 'rxjs';
import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
  it('should emit true when BreakpointObserver matches', async () => {
    const breakpointObserverMock: Partial<BreakpointObserver> = {
      observe: () => of({ matches: true, breakpoints: {} } as BreakpointState),
    };

    TestBed.configureTestingModule({
      providers: [
        ViewportService,
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    const service = TestBed.inject(ViewportService);
    const value = await firstValueFrom(service.isMobile$);
    expect(value).toBe(true);
  });

  it('should emit false when BreakpointObserver does not match', async () => {
    const breakpointObserverMock: Partial<BreakpointObserver> = {
      observe: () => of({ matches: false, breakpoints: {} } as BreakpointState),
    };

    TestBed.configureTestingModule({
      providers: [
        ViewportService,
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
      ],
    });

    const service = TestBed.inject(ViewportService);
    const value = await firstValueFrom(service.isMobile$);
    expect(value).toBe(false);
  });
});
