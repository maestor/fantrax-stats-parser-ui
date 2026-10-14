import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { switchMap } from 'rxjs';
import { ApiService, TradeDetail } from '@services/api.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { resourceState } from '../resource-state';
import { careerProfileSlug } from '@shared/utils/career-profile-url.utils';

@Component({
  imports: [RouterLink, MatButtonModule, ...TRANSLATE_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-career-trade',
  styleUrl: './career-trade.component.scss',
  templateUrl: './career-trade.component.html',
})
export class CareerTradeComponent {
  private readonly api = inject(ApiService);
  private readonly revision = signal(0);
  readonly tradeId = input.required<string>();
  readonly profileSlug = careerProfileSlug;
  private readonly request = computed(() => ({ id: this.tradeId(), revision: this.revision() }));
  readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ id }) => resourceState(this.api.getTradeDetail(id))),
    ),
    { initialValue: { data: null, loading: true, error: null } },
  );
  readonly packages = computed(() => {
    type Asset = TradeDetail['blocks'][number]['assets'][number];
    const pickTeamName = (asset: Asset): string =>
      asset.draftOriginalOwner?.name ?? asset.name.slice(asset.name.indexOf('(') + 1, -1);
    const packages = new Map<string, { team: Asset['toTeam']; assets: Asset[] }>();
    for (const block of this.state().data?.blocks ?? []) {
      for (const asset of block.assets) {
        for (const team of [asset.fromTeam, asset.toTeam]) {
          if (!packages.has(team.id)) packages.set(team.id, { team, assets: [] });
        }
        packages.get(asset.toTeam.id)!.assets.push(asset);
      }
    }
    return [...packages.values()].map((received) => {
      const picks = received.assets.filter((asset) => asset.type === 'draft_pick');
      picks.sort((left, right) =>
        left.draftRound! - right.draftRound! ||
        left.draftSeason! - right.draftSeason! ||
        pickTeamName(left).localeCompare(pickTeamName(right)),
      );
      let pickIndex = 0;
      return {
        ...received,
        assets: received.assets.map((asset) =>
          asset.type === 'draft_pick' ? picks[pickIndex++] : asset,
        ),
      };
    });
  });
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
