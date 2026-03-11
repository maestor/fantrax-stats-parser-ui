import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

const DEFAULT_ROOT_MARGIN = '0px';
const DEFAULT_MINIMUM_VISIBLE_PIXELS = 100;
const OBSERVER_THRESHOLDS = Array.from({ length: 21 }, (_, index) => index / 20);

@Directive({
  selector: '[appActivateOnViewport]',
})
export class ActivateOnViewportDirective {
  readonly rootMargin = input(DEFAULT_ROOT_MARGIN, {
    alias: 'appActivateOnViewportRootMargin',
  });
  readonly minimumVisiblePixels = input(DEFAULT_MINIMUM_VISIBLE_PIXELS, {
    alias: 'appActivateOnViewportMinPixels',
  });
  readonly visible = output<void>({ alias: 'appActivateOnViewportVisible' });

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  private observer: IntersectionObserver | null = null;
  private hasEmitted = false;

  constructor() {
    afterNextRender(() => {
      this.initializeObserver();
    });

    this.destroyRef.onDestroy(() => {
      this.disconnectObserver();
    });
  }

  private initializeObserver(): void {
    if (this.hasEmitted) {
      return;
    }

    const minimumVisiblePixels = this.normalizeVisiblePixels(this.minimumVisiblePixels());

    if (typeof IntersectionObserver !== 'function') {
      this.emitVisible();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => this.meetsVisibilityThreshold(entry, minimumVisiblePixels))) {
          return;
        }

        this.emitVisible();
        this.disconnectObserver();
      },
      {
        rootMargin: this.rootMargin(),
        threshold: OBSERVER_THRESHOLDS,
      },
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  private emitVisible(): void {
    if (this.hasEmitted) {
      return;
    }

    this.hasEmitted = true;
    this.visible.emit();
  }

  private disconnectObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private meetsVisibilityThreshold(
    entry: IntersectionObserverEntry,
    minimumVisiblePixels: number,
  ): boolean {
    if (!entry.isIntersecting) {
      return false;
    }

    const targetHeight = entry.boundingClientRect.height;
    const requiredVisiblePixels = Math.min(targetHeight, minimumVisiblePixels);
    return entry.intersectionRect.height >= requiredVisiblePixels;
  }

  private normalizeVisiblePixels(value: number): number {
    return Math.max(value, 0);
  }
}
