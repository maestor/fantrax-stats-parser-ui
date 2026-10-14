import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { switchMap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ApiService, CareerHistory } from '@services/api.service';
import { ViewportService } from '@services/viewport.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { formatDateForLocale } from '@shared/utils/date.utils';
import { formatSeasonDisplay } from '@shared/utils/season.utils';
import { resourceState } from '../resource-state';
import { CareerTradeComponent } from '../career-trade/career-trade.component';

@Component({
  imports: [...TRANSLATE_IMPORTS, MatButtonModule, CareerTradeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-career-history',
  styleUrl: './career-history.component.scss',
  templateUrl: './career-history.component.html',
})
export class CareerHistoryComponent {
  private readonly api = inject(ApiService);
  private readonly translate = inject(TranslateService);
  private readonly revision = signal(0);
  readonly isMobile = toSignal(inject(ViewportService).isMobile$, { initialValue: true });
  readonly id = input.required<string>();
  readonly expanded = linkedSignal<ReadonlySet<string>>(() => {
    this.id();
    return new Set<string>();
  });
  private readonly request = computed(() => ({ id: this.id(), revision: this.revision() }));
  readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ id }) => resourceState(this.api.getCareerHistory(id))),
    ),
    { initialValue: { data: null, loading: true, error: null } },
  );
  readonly groups = computed(() => {
    const groups = new Map<number | null, CareerHistory['events']>();
    for (const event of this.state().data?.events ?? []) {
      const group = groups.get(event.season);
      if (group) group.push(event);
      else groups.set(event.season, [event]);
    }
    return [...groups].map(([season, events]) => ({ season, events }));
  });
  readonly formatSeason = formatSeasonDisplay;
  dateLabel(date: string): string | null {
    return formatDateForLocale(
      date,
      this.translate.getCurrentLang() || this.translate.getFallbackLang() || 'fi',
      {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Helsinki',
      },
    );
  }
  reload(): void {
    this.revision.update((value) => value + 1);
  }
  toggle(id: string): void {
    this.expanded.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}
