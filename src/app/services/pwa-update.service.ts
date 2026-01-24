import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, distinctUntilChanged, filter, fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  // In unit tests (and in dev builds where the SW is disabled), SwUpdate may not be provided.
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  private readonly updateAvailableSubject = new BehaviorSubject(false);
  readonly updateAvailable$ = this.updateAvailableSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (event: VersionEvent): event is VersionReadyEvent =>
            event.type === 'VERSION_READY'
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.updateAvailableSubject.next(true);
      });

    // Mobile PWAs (esp. iOS) may not check often; prompt a check when the app comes back.
    fromEvent(this.document, 'visibilitychange')
      .pipe(
        filter(() => this.document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        void this.swUpdate?.checkForUpdate();
      });
  }

  async activateAndReload(): Promise<void> {
    if (!this.swUpdate?.isEnabled) return;

    await this.swUpdate.activateUpdate();
    this.document.defaultView?.location.reload();
  }
}
