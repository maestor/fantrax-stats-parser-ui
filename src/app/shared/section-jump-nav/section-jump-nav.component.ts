import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

let nextSectionJumpNavId = 0;

export interface SectionJumpNavItem {
  readonly id: string;
  readonly labelKey: string;
}

@Component({
  selector: 'app-section-jump-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
  templateUrl: './section-jump-nav.component.html',
  styleUrl: './section-jump-nav.component.scss',
})
export class SectionJumpNavComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('scrollContainer', { read: ElementRef })
  private scrollContainerRef?: ElementRef<HTMLElement>;

  readonly items = input.required<readonly SectionJumpNavItem[]>();
  readonly ariaLabelKey = input.required<string>();
  readonly scrollHintKey = input('sectionJumpNav.horizontalScrollHint');
  readonly activeItemId = input<string | null>(null);

  readonly itemSelected = output<string>();

  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(false);
  readonly hasOverflow = signal(false);
  readonly instructionsId = `section-jump-nav-instructions-${nextSectionJumpNavId += 1}`;

  private viewInitialized = false;
  private syncPending = false;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });

    effect(() => {
      this.items();
      this.activeItemId();
      this.scheduleSync();
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.scheduleSync();
  }

  onScroll(): void {
    this.refreshOverflowState();
  }

  onItemClick(itemId: string): void {
    this.itemSelected.emit(itemId);
    this.scrollItemIntoView(itemId, 'smooth');
    this.refreshOverflowState();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleSync();
  }

  refreshOverflowState(): void {
    const container = this.scrollContainerRef?.nativeElement;
    if (!container) {
      return;
    }

    const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
    const scrollLeft = Math.max(container.scrollLeft, 0);
    const threshold = 2;
    const hasOverflow = maxScrollLeft > threshold;

    this.hasOverflow.set(hasOverflow);
    this.canScrollStart.set(hasOverflow && scrollLeft > threshold);
    this.canScrollEnd.set(hasOverflow && maxScrollLeft - scrollLeft > threshold);
  }

  private scheduleSync(): void {
    if (!this.viewInitialized || this.syncPending) {
      return;
    }

    this.syncPending = true;
    queueMicrotask(() => {
      this.syncPending = false;

      if (this.destroyed) {
        return;
      }

      this.refreshOverflowState();

      const activeItemId = this.activeItemId();
      if (!activeItemId) {
        return;
      }

      this.scrollItemIntoView(activeItemId, 'auto');
      this.refreshOverflowState();
    });
  }

  private scrollItemIntoView(itemId: string, behavior: ScrollBehavior): void {
    const container = this.scrollContainerRef?.nativeElement;
    if (!container) {
      return;
    }

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
