import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly storageKey = 'fantrax.selectedTeamId';
  private readonly defaultTeamId = '1';

  private readonly selectedTeamIdSubject = new BehaviorSubject<string>(
    this.loadInitialTeamId()
  );

  readonly selectedTeamId$ = this.selectedTeamIdSubject.asObservable();

  get selectedTeamId(): string {
    return this.selectedTeamIdSubject.value;
  }

  setTeamId(teamId: string): void {
    if (!teamId || teamId === this.selectedTeamIdSubject.value) return;

    this.selectedTeamIdSubject.next(teamId);
    this.persistTeamId(teamId);
  }

  private loadInitialTeamId(): string {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored && stored.trim().length > 0 ? stored : this.defaultTeamId;
    } catch {
      return this.defaultTeamId;
    }
  }

  private persistTeamId(teamId: string): void {
    try {
      localStorage.setItem(this.storageKey, teamId);
    } catch {
      // ignore storage errors (e.g. privacy mode)
    }
  }
}
