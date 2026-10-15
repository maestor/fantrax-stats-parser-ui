import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService, Team, TradeDetail } from '@services/api.service';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { resourceState } from '../resource-state';
import { careerProfileSlug } from '@shared/utils/career-profile-url.utils';

const ORDINAL_SUFFIXES: Readonly<Record<string, string>> = {
  one: 'st', two: 'nd', few: 'rd', other: 'th',
};

@Component({
  imports: [RouterLink, MatButtonModule, ...TRANSLATE_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-career-trade',
  styleUrl: './career-trade.component.scss',
  templateUrl: './career-trade.component.html',
})
export class CareerTradeComponent {
  private readonly api = inject(ApiService);
  private readonly teams = toSignal(this.api.getTeams().pipe(catchError(() => of([]))), {
    initialValue: [] as Team[],
  });
  private readonly ordinals = new Intl.PluralRules('en', { type: 'ordinal' });
  private readonly revision = signal(0);
  readonly tradeId = input.required<string>();
  readonly playerId = input.required<string>();
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
    const playerId = this.playerId();
    const receivesPlayer = (received: { assets: Asset[] }): number =>
      Number(received.assets.some((asset) => asset.entityId === playerId));
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
    const orderedPackages = [...packages.values()]
      .sort((left, right) => receivesPlayer(right) - receivesPlayer(left));
    return orderedPackages.map((received) => {
      const picks = received.assets.filter((asset) => asset.type === 'draft_pick');
      picks.sort((left, right) =>
        left.draftRound! - right.draftRound! ||
        left.draftSeason! - right.draftSeason! ||
        pickTeamName(left).localeCompare(pickTeamName(right)),
      );
      let pickIndex = 0;
      return {
        ...received,
        assets: received.assets.map((receivedAsset) => {
          const asset = receivedAsset.type === 'draft_pick' ? picks[pickIndex++] : receivedAsset;
          const owner = asset.draftOriginalOwner;
          return {
            ...asset,
            draftPick: asset.type === 'draft_pick' && asset.draftSeason !== null &&
              asset.draftRound !== null && owner
              ? {
                  year: asset.draftSeason,
                  round: `${asset.draftRound}${ORDINAL_SUFFIXES[this.ordinals.select(asset.draftRound)]}`,
                  ownerName: owner.name,
                  ownerAbbr: this.teams().find((team) => team.id === owner.id)?.teamAbbr ?? owner.name,
                }
              : null,
          };
        }).sort((left, right) =>
          Number(right.entityId === playerId) - Number(left.entityId === playerId),
        ),
      };
    });
  });
  reload(): void {
    this.revision.update((value) => value + 1);
  }
}
