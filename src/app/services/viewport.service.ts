import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private breakpointObserver = inject(BreakpointObserver);

  readonly isMobile$ = this.breakpointObserver
    .observe('(max-width: 768px)')
    .pipe(
      map((result) => result.matches),
      shareReplay({ bufferSize: 1, refCount: true })
    );
}
