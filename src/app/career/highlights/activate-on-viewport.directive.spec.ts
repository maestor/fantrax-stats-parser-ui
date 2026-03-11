import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import { ActivateOnViewportDirective } from './activate-on-viewport.directive';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  private target: Element | null = null;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.target = target;
  }

  disconnect(): void {
    this.target = null;
  }

  unobserve(target: Element): void {
    if (this.target === target) {
      this.target = null;
    }
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(visibleHeight: number, targetHeight = 320): void {
    if (!this.target) {
      return;
    }

    this.callback(
      [
        {
          isIntersecting: visibleHeight > 0,
          intersectionRatio: targetHeight === 0 ? 0 : visibleHeight / targetHeight,
          intersectionRect: { height: visibleHeight } as DOMRectReadOnly,
          boundingClientRect: { height: targetHeight } as DOMRectReadOnly,
          target: this.target,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

@Component({
  standalone: true,
  imports: [ActivateOnViewportDirective],
  template: `
    <div
      appActivateOnViewport
      [appActivateOnViewportMinPixels]="minimumVisiblePixels"
      (appActivateOnViewportVisible)="activations = activations + 1"
    >
      Highlight card
    </div>
    <p>{{ activations }}</p>
  `,
})
class ActivateOnViewportHostComponent {
  minimumVisiblePixels = 240;
  activations = 0;
}

describe('ActivateOnViewportDirective', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal(
      'IntersectionObserver',
      FakeIntersectionObserver as unknown as typeof IntersectionObserver,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('waits until enough vertical pixels of the element are visible before emitting', async () => {
    await render(ActivateOnViewportHostComponent);

    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(Array.isArray(FakeIntersectionObserver.instances[0]?.options?.threshold)).toBe(true);

    FakeIntersectionObserver.instances[0]?.trigger(160);
    expect(screen.getByText('0')).toBeInTheDocument();

    FakeIntersectionObserver.instances[0]?.trigger(240);
    expect(await screen.findByText('1')).toBeInTheDocument();

    FakeIntersectionObserver.instances[0]?.trigger(260);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
