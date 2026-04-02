import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, defer, distinctUntilChanged, map, of } from 'rxjs';

import { ApiService } from '@services/api.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { SettingsDrawerMode } from '@shared/utils/settings-drawer.utils';
import { StatsContext } from '@shared/types/context.types';
import { SettingsPanelComponent } from '@shared/settings-panel/settings-panel.component';
import { TeamSwitcherComponent } from '@shared/top-controls/team-switcher/team-switcher.component';
import { TopControlsComponent } from '@shared/top-controls/top-controls.component';

@Component({
  selector: 'app-settings-drawer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    TeamSwitcherComponent,
    TopControlsComponent,
    SettingsPanelComponent,
  ],
  templateUrl: './settings-drawer.component.html',
  styleUrl: './settings-drawer.component.scss',
})
export class SettingsDrawerComponent {
  readonly mode = input.required<SettingsDrawerMode>();
  readonly statsContext = input<StatsContext | undefined>(undefined);
  readonly closeRequested = output<void>();

  private readonly apiService = inject(ApiService);
  private readonly drawerContextService = inject(DrawerContextService);
  private readonly fiLastModifiedFormatter = new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  readonly resolvedStatsContext = computed(() => {
    if (this.mode() !== 'stats') {
      return undefined;
    }

    return this.statsContext() ?? 'player';
  });

  readonly drawerMaxGames = computed(() => {
    const context = this.resolvedStatsContext();
    const state = this.drawerContextService.stateSignal();

    return context === 'goalie' ? state.goalieMaxGames : state.playerMaxGames;
  });

  readonly lastModifiedText = toSignal(
    defer(() => this.apiService.getLastModified()).pipe(
      map((res) => this.formatLastModified(res?.lastModified)),
      catchError(() => of(null)),
      distinctUntilChanged(),
    ),
    { initialValue: null },
  );

  private formatLastModified(iso: string | undefined): string | null {
    if (!iso) return null;

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    return this.fiLastModifiedFormatter.format(date);
  }
}
