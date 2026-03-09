import { Injectable, signal } from '@angular/core';

export const FOOTER_VISIBILITY_FALLBACK_MS = 2500;

@Injectable({ providedIn: 'root' })
export class FooterVisibilityService {
  readonly footerVisible = signal(false);

  private navigationCycle = 0;
  private fallbackTimerId?: ReturnType<typeof setTimeout>;

  constructor() {
    this.scheduleFallback(this.navigationCycle);
  }

  currentCycle(): number {
    return this.navigationCycle;
  }

  beginNavigation(): number {
    this.navigationCycle += 1;
    this.footerVisible.set(false);
    this.scheduleFallback(this.navigationCycle);
    return this.navigationCycle;
  }

  markReady(cycle: number = this.navigationCycle): void {
    if (cycle !== this.navigationCycle) {
      return;
    }

    this.clearFallback();
    this.footerVisible.set(true);
  }

  private scheduleFallback(cycle: number): void {
    this.clearFallback();
    this.fallbackTimerId = setTimeout(() => {
      if (cycle !== this.navigationCycle) {
        return;
      }

      this.fallbackTimerId = undefined;
      this.footerVisible.set(true);
    }, FOOTER_VISIBILITY_FALLBACK_MS);
  }

  private clearFallback(): void {
    if (!this.fallbackTimerId) {
      return;
    }

    clearTimeout(this.fallbackTimerId);
    this.fallbackTimerId = undefined;
  }
}
