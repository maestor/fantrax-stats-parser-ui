import { Component, ViewChild } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import {
  SectionJumpNavComponent,
  SectionJumpNavItem,
} from './section-jump-nav.component';

@Component({
  standalone: true,
  imports: [SectionJumpNavComponent],
  template: `
    <app-section-jump-nav
      [items]="items"
      [ariaLabelKey]="ariaLabelKey"
      [activeItemId]="activeItemId"
      (itemSelected)="selectedItemId = $event"
    />
  `,
})
class SectionJumpNavHostComponent {
  @ViewChild(SectionJumpNavComponent)
  sectionJumpNavComponent?: SectionJumpNavComponent;

  readonly ariaLabelKey = 'career.highlights.jumpNavAriaLabel';
  readonly items: readonly SectionJumpNavItem[] = [
    { id: 'one', labelKey: 'career.highlights.sections.achievements.title' },
    { id: 'two', labelKey: 'career.highlights.sections.transactions.title' },
    { id: 'three', labelKey: 'career.highlights.sections.longStays.title' },
  ];
  activeItemId: string | null = null;
  selectedItemId: string | null = null;
}

describe('SectionJumpNavComponent', () => {
  async function setup() {
    return render(SectionJumpNavHostComponent, {
      imports: [TranslateModule.forRoot()],
    });
  }

  function defineScrollerDimensions(
    scroller: HTMLElement,
    dimensions: { clientWidth: number; scrollWidth: number; scrollLeft?: number },
  ) {
    Object.defineProperty(scroller, 'clientWidth', {
      configurable: true,
      value: dimensions.clientWidth,
    });
    Object.defineProperty(scroller, 'scrollWidth', {
      configurable: true,
      value: dimensions.scrollWidth,
    });
    Object.defineProperty(scroller, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: dimensions.scrollLeft ?? 0,
    });
  }

  it('renders the configured jump buttons', async () => {
    await setup();

    expect(
      await screen.findByRole('button', {
        name: 'career.highlights.sections.achievements.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'career.highlights.sections.transactions.title',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', {
        name: 'career.highlights.jumpNavAriaLabel',
      }),
    ).toBeInTheDocument();
  });

  it('adds overflow fades and the scroll hint when the nav content exceeds the viewport', async () => {
    const view = await setup();
    const nav = screen.getByRole('navigation', {
      name: 'career.highlights.jumpNavAriaLabel',
    });
    const scroller = view.container.querySelector('.section-jump-nav-scroll') as HTMLElement | null;

    expect(scroller).not.toBeNull();

    defineScrollerDimensions(scroller as HTMLElement, {
      clientWidth: 180,
      scrollWidth: 420,
      scrollLeft: 0,
    });

    view.fixture.componentInstance.sectionJumpNavComponent?.refreshOverflowState();
    view.fixture.detectChanges();

    expect(nav).toHaveClass('section-jump-nav--can-scroll-end');
    expect(nav).not.toHaveClass('section-jump-nav--can-scroll-start');
    expect(nav).toHaveAttribute(
      'aria-describedby',
      view.fixture.componentInstance.sectionJumpNavComponent?.instructionsId,
    );

    Object.defineProperty(scroller as HTMLElement, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 80,
    });
    fireEvent.scroll(scroller as HTMLElement);
    view.fixture.detectChanges();

    expect(nav).toHaveClass('section-jump-nav--can-scroll-start');
    expect(nav).toHaveClass('section-jump-nav--can-scroll-end');
  });

  it('emits the clicked item id and keeps active items styled for future reuse', async () => {
    const view = await setup();
    const scroller = view.container.querySelector('.section-jump-nav-scroll') as HTMLElement | null;

    expect(scroller).not.toBeNull();

    defineScrollerDimensions(scroller as HTMLElement, {
      clientWidth: 180,
      scrollWidth: 420,
      scrollLeft: 0,
    });

    const activeButton = screen.getByRole('button', {
      name: 'career.highlights.sections.transactions.title',
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(activeButton, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    view.fixture.componentInstance.activeItemId = 'two';
    view.fixture.detectChanges();

    expect(activeButton).toHaveClass('section-jump-nav-link--active');

    fireEvent.click(activeButton);
    view.fixture.detectChanges();

    expect(view.fixture.componentInstance.selectedItemId).toBe('two');
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  });
});
