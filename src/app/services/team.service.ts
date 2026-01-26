import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly settingsService = inject(SettingsService);

  readonly selectedTeamId$: Observable<string> = this.settingsService.selectedTeamId$;

  get selectedTeamId(): string {
    return this.settingsService.selectedTeamId;
  }

  setTeamId(teamId: string): void {
    if (!teamId || teamId === this.selectedTeamId) return;

    // Avoid carrying over a different team's startFrom into new team requests.
    // The StartFromSeasonSwitcher will resolve the correct oldest season and persist it.
    this.settingsService.setStartFromSeason(undefined);
    this.settingsService.setSelectedTeamId(teamId);
  }
}
