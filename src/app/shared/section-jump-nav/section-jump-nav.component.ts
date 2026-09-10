import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  afterRenderEffect,
  input,
  output,
  signal,
} from '@angular/core';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';

let nextSectionJumpNavId = 0;

export interface SectionJumpNavItem {
  readonly id: string;
  readonly labelKey: string;
}

@Component({
  selector: 'app-section-jump-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...TRANSLATE_IMPORTS],
  templateUrl: './section-jump-nav.component.html',
  styleUrl: './section-jump-nav.component.scss',
  host: { '(window:resize)': 'onWindowResize()' },
})
export class SectionJumpNavComponent {
  private readonly scrollContainerRef = viewChild.required<ElementRef<HTMLElement>>('scrollContainer');
  private readonly resizeRevision = signal(0);

  readonly items = input.required<readonly SectionJumpNavItem[]>();
  readonly ariaLabelKey = input.required<string>();
  readonly scrollHintKey = input('sectionJumpNav.horizontalScrollHint');
  readonly activeItemId = input<string | null>(null);

  readonly itemSelected = output<string>();

  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(false);
  readonly hasOverflow = signal(false);
  readonly instructionsId = `section-jump-nav-instructions-${nextSectionJumpNavId += 1}`;

  constructor() {
    // Scrolling changes layout and the overflow hints depend on its measured result.
    afterRenderEffect(() => {
      this.items();
      this.resizeRevision();
      const activeItemId = this.activeItemId();
      if (activeItemId) {
        this.scrollItemIntoView(activeItemId, 'auto');
      }
      this.refreshOverflowState();
    });
  }

  onScroll(): void {
    this.refreshOverflowState();
  }

  onItemClick(itemId: string): void {
    this.itemSelected.emit(itemId);
    this.scrollItemIntoView(itemId, 'smooth');
    this.refreshOverflowState();
  }

  onWindowResize(): void {
    this.resizeRevision.update((revision) => revision + 1);
  }

  refreshOverflowState(): void {
    const container = this.scrollContainerRef().nativeElement;

    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
    const scrollLeft = Math.max(container.scrollLeft, 0);
    const threshold = 2;
    const hasOverflow = maxScrollLeft > threshold;

    this.hasOverflow.set(hasOverflow);
    this.canScrollStart.set(hasOverflow && scrollLeft > threshold);
    this.canScrollEnd.set(hasOverflow && maxScrollLeft - scrollLeft > threshold);
  }

  private scrollItemIntoView(itemId: string, behavior: ScrollBehavior): void {
    const container = this.scrollContainerRef().nativeElement;

    const escapedItemId = itemId.replaceAll('"', '\\"');
    const itemButton = container.querySelector<HTMLElement>(
      `[data-nav-item-id="${escapedItemId}"]`,
    );

    if (typeof itemButton?.scrollIntoView !== 'function') {
      return;
    }

    itemButton.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior,
    });
  }
}
