import { Injectable, Injector, inject, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Goalie, Player } from '@services/api.service';
import type { PlayerCardDialogData } from '@shared/player-card/player-card.component';

let playerCardComponentPromise: Promise<
  typeof import('@shared/player-card/player-card.component')
> | null = null;

function loadPlayerCardComponent() {
  playerCardComponentPromise ??= import('@shared/player-card/player-card.component');
  return playerCardComponentPromise;
}

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

type PlayerCardPrefetchEnvironment = Pick<Window, 'matchMedia' | 'navigator'> | null | undefined;

export function shouldSchedulePlayerCardPrefetch(
  env: PlayerCardPrefetchEnvironment,
): boolean {
  if (typeof env?.matchMedia !== 'function') {
    return false;
  }

  if (env.matchMedia('(max-width: 768px)').matches) {
    return false;
  }

  if (!env.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return false;
  }

  const connection = (env.navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  if (connection?.saveData) {
    return false;
  }

  return !['slow-2g', '2g', '3g'].includes(
    connection?.effectiveType?.toLowerCase() ?? '',
  );
}

type OpenPlayerCardOptions = {
  row: Player | Goalie;
  allRows: (Player | Goalie)[];
  onNavigate(newIndex: number): void;
  onClose(navigatedIndex: number): void;
};

@Injectable()
export class StatsTablePlayerCardService implements OnDestroy {
  private readonly injector = inject(Injector);

  private openingPlayerCard = false;
  private playerCardPrefetchScheduled = false;
  private playerCardPrefetchIdleId?: number;
  private playerCardPrefetchTimerId?: ReturnType<typeof setTimeout>;

  async openPlayerCard(options: OpenPlayerCardOptions): Promise<void> {
    if (this.openingPlayerCard) {
      return;
    }

    this.openingPlayerCard = true;

    let navigatedIndex = options.allRows.indexOf(options.row);

    const dialogData: PlayerCardDialogData = {
      player: options.row,
      navigationContext: {
        allPlayers: options.allRows,
        currentIndex: navigatedIndex,
        onNavigate: (newIndex: number) => {
          navigatedIndex = newIndex;
          options.onNavigate(newIndex);
        },
      },
    };

    try {
      const { PlayerCardComponent } = await loadPlayerCardComponent();
      const dialogRef = this.injector.get(MatDialog).open(PlayerCardComponent, {
        data: dialogData,
        maxWidth: '95vw',
        width: 'auto',
        panelClass: 'player-card-dialog',
      });

      dialogRef.afterClosed().subscribe(() => {
        options.onClose(navigatedIndex);
      });
    } finally {
      this.openingPlayerCard = false;
    }
  }

  onPlayerCardPrefetchIntent(clickable: boolean): void {
    if (this.playerCardPrefetchScheduled || !clickable) {
      return;
    }

    if (typeof window === 'undefined' || !shouldSchedulePlayerCardPrefetch(window)) {
      return;
    }

    this.playerCardPrefetchScheduled = true;
    this.schedulePlayerCardPrefetch();
  }

  ngOnDestroy(): void {
    this.clearPlayerCardPrefetch();
  }

  private schedulePlayerCardPrefetch(): void {
    const warmPlayerCardChunk = () => {
      void loadPlayerCardComponent();
    };

    if (typeof window === 'undefined') {
      return;
    }

    if ('requestIdleCallback' in window) {
      this.playerCardPrefetchIdleId = window.requestIdleCallback(() => {
        this.playerCardPrefetchIdleId = undefined;
        warmPlayerCardChunk();
      }, { timeout: 2000 });
      return;
    }

    this.playerCardPrefetchTimerId = setTimeout(() => {
      this.playerCardPrefetchTimerId = undefined;
      warmPlayerCardChunk();
    }, 1500);
  }

  private clearPlayerCardPrefetch(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.playerCardPrefetchIdleId !== undefined && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.playerCardPrefetchIdleId);
      this.playerCardPrefetchIdleId = undefined;
    }

    if (this.playerCardPrefetchTimerId !== undefined) {
      clearTimeout(this.playerCardPrefetchTimerId);
      this.playerCardPrefetchTimerId = undefined;
    }
  }
}
