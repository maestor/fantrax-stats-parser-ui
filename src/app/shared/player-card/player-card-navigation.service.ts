import { Injectable, ElementRef, ChangeDetectorRef, NgZone, inject, OnDestroy } from '@angular/core';
import { Player, Goalie } from '@services/api.service';
import { PlayerCardDialogData } from './player-card.component';

type NavigationContext = NonNullable<PlayerCardDialogData['navigationContext']>;

@Injectable()
export class PlayerCardNavigationService implements OnDestroy {
  private zone = inject(NgZone);

  currentIndex = 0;
  allPlayers: (Player | Goalie)[] = [];
  slideClass = '';
  liveRegionMessage = '';

  private context: NavigationContext | undefined;
  private host!: ElementRef<HTMLElement>;
  private cdr!: ChangeDetectorRef;
  private onNavigateCallback?: (player: Player | Goalie, index: number) => void;

  private swipeStartX = 0;
  private swipeStartY = 0;
  private readonly swipeThreshold = 50;
  private readonly swipeMaxVertical = 75;
  private wheelDeltaX = 0;
  private wheelCooldown = false;
  private wheelResetTimer: ReturnType<typeof setTimeout> | null = null;
  private wheelCooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private animationTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly animationDuration = 125;
  private readonly wheelHandler = (e: WheelEvent) => this.onWheel(e);

  init(
    context: NavigationContext | undefined,
    host: ElementRef<HTMLElement>,
    cdr: ChangeDetectorRef,
    onNavigate: (player: Player | Goalie, index: number) => void,
  ): void {
    this.context = context;
    this.currentIndex = context?.currentIndex ?? 0;
    this.allPlayers = context?.allPlayers ?? [];
    this.host = host;
    this.cdr = cdr;
    this.onNavigateCallback = onNavigate;

    this.zone.runOutsideAngular(() => {
      document.addEventListener('wheel', this.wheelHandler, { passive: false });
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('wheel', this.wheelHandler);
    if (this.wheelResetTimer) clearTimeout(this.wheelResetTimer);
    if (this.wheelCooldownTimer) clearTimeout(this.wheelCooldownTimer);
    if (this.animationTimer) clearTimeout(this.animationTimer);
  }

  canNavigate(): boolean {
    return this.allPlayers.length > 1;
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.canNavigate()) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); this.navigateToPrevious(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); this.navigateToNext(); }
  }

  handleTouchStart(event: TouchEvent): void {
    if (!this.canNavigate() || event.touches.length !== 1) return;
    this.swipeStartX = event.touches[0].clientX;
    this.swipeStartY = event.touches[0].clientY;
  }

  handleTouchEnd(event: TouchEvent): void {
    if (!this.canNavigate() || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.swipeStartX;
    const deltaY = Math.abs(touch.clientY - this.swipeStartY);
    if (deltaY > this.swipeMaxVertical) return;
    if (deltaX < -this.swipeThreshold) this.navigateToNext();
    else if (deltaX > this.swipeThreshold) this.navigateToPrevious();
  }

  navigateToPrevious(): void {
    const newIndex = this.currentIndex - 1;
    this.navigateToIndex(newIndex < 0 ? this.allPlayers.length - 1 : newIndex, 'right');
  }

  navigateToNext(): void {
    this.navigateToIndex((this.currentIndex + 1) % this.allPlayers.length, 'left');
  }

  navigateToIndex(newIndex: number, direction: 'left' | 'right'): void {
    if (this.animationTimer) { clearTimeout(this.animationTimer); this.animationTimer = null; }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) { this.applyNavigation(newIndex); return; }

    this.slideClass = `card-content-wrapper slide-out-${direction}`;
    this.cdr.detectChanges();

    this.animationTimer = setTimeout(() => {
      this.applyNavigation(newIndex);
      const enterFrom = direction === 'left' ? 'left' : 'right';
      this.slideClass = `card-content-wrapper slide-in-${enterFrom}`;
      this.cdr.detectChanges();
      this.host.nativeElement.querySelector('.card-content-wrapper')?.getBoundingClientRect();
      this.slideClass = 'card-content-wrapper';
      this.cdr.detectChanges();
      this.animationTimer = setTimeout(() => { this.animationTimer = null; }, this.animationDuration);
    }, this.animationDuration);
  }

  private applyNavigation(newIndex: number): void {
    this.currentIndex = newIndex;
    this.context?.onNavigate?.(newIndex);
    this.onNavigateCallback?.(this.allPlayers[newIndex], newIndex);
    this.announcePlayerChange(this.allPlayers[newIndex], newIndex);
    this.cdr.detectChanges();
  }

  private announcePlayerChange(player: Player | Goalie, index: number): void {
    this.liveRegionMessage = '';
    this.cdr.detectChanges();
    this.liveRegionMessage = `Pelaaja ${index + 1} / ${this.allPlayers.length}: ${player.name}`;
  }

  private onWheel(event: WheelEvent): void {
    if (!this.canNavigate()) return;
    if (event.deltaX !== 0) event.preventDefault();
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    if (this.wheelCooldown) return;

    if (this.wheelResetTimer) clearTimeout(this.wheelResetTimer);
    this.wheelResetTimer = setTimeout(() => { this.wheelDeltaX = 0; }, 200);
    this.wheelDeltaX += event.deltaX;

    if (this.wheelDeltaX > this.swipeThreshold) {
      this.zone.run(() => this.navigateToNext());
      this.startWheelCooldown();
    } else if (this.wheelDeltaX < -this.swipeThreshold) {
      this.zone.run(() => this.navigateToPrevious());
      this.startWheelCooldown();
    }
  }

  private startWheelCooldown(): void {
    this.wheelDeltaX = 0;
    this.wheelCooldown = true;
    if (this.wheelResetTimer) clearTimeout(this.wheelResetTimer);
    this.wheelCooldownTimer = setTimeout(() => { this.wheelCooldown = false; this.wheelDeltaX = 0; }, 500);
  }
}
