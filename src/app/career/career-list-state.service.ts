import { Injectable } from '@angular/core';
import type { VirtualTableBrowseState } from '@shared/stats-table/virtual-table.component';

@Injectable({ providedIn: 'root' })
export class CareerListStateService {
  private readonly states = new Map<'players' | 'goalies', VirtualTableBrowseState>();
  save(kind: 'players' | 'goalies', state: VirtualTableBrowseState): void {
    this.states.set(kind, state);
  }
  restore(kind: 'players' | 'goalies'): VirtualTableBrowseState | null {
    return this.states.get(kind) ?? null;
  }
}
