import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import {
  provideDisabledMaterialAnimations,
} from '../../testing/behavior-test-utils';
import { TableCardComponent } from './table-card.component';
import { TableCardRow } from './table-card.types';

@Component({
  standalone: true,
  imports: [TableCardComponent],
  template: `
    <app-table-card
      [titleKey]="titleKey"
      [descriptionKey]="descriptionKey"
      [descriptionRequiresParams]="descriptionRequiresParams"
      [descriptionParams]="descriptionParams"
      [primaryColumnLabelKey]="primaryColumnLabelKey"
      [valueColumnLabelKey]="valueColumnLabelKey"
      [deferred]="deferred"
      [rows]="rows"
      [loading]="loading"
      [apiError]="apiError"
      [skip]="skip"
      [take]="take"
      [total]="total"
    />
  `,
})
class TableCardHostComponent {
  titleKey = 'career.highlights.cards.mostTeamsPlayed.title';
  descriptionKey = 'career.highlights.cards.mostTeamsPlayed.description';
  descriptionRequiresParams = false;
  descriptionParams: Readonly<Record<string, number | string>> | undefined = undefined;
  primaryColumnLabelKey = 'career.highlights.columns.player';
  valueColumnLabelKey = 'career.highlights.columns.teamCount';
  deferred = false;
  loading = false;
  apiError = false;
  skip = 0;
  take = 10;
  total = 12;
  rows: readonly TableCardRow[] = [
    {
      key: 'row-1',
      primaryText: 'F Jamie Benn',
      value: 5,
      detailLines: ['Colorado Avalanche', 'Carolina Hurricanes'],
      detailLabel: 'Jamie Benn',
    },
  ];
}

describe('TableCardComponent', () => {
  async function setup(componentProperties: Partial<TableCardHostComponent> = {}) {
    return render(TableCardHostComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [provideDisabledMaterialAnimations()],
      componentProperties,
    });
  }

  it('renders semantic headings, rows, and page controls for populated data', async () => {
    await setup();

    expect(
      await screen.findByRole('heading', { name: 'career.highlights.cards.mostTeamsPlayed.title' })
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('F Jamie Benn')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('tableCard.paginationSummary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tableCard.previousPage' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'tableCard.nextPage' })).toBeEnabled();
  });

  it('shows an empty-state message when there are no rows and the card is not loading', async () => {
    await setup({
      rows: [],
      total: 0,
    });

    expect(await screen.findByText('tableCard.noResults')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a deferred placeholder until the card is activated', async () => {
    await setup({
      deferred: true,
      rows: [],
      total: 0,
    });

    expect(await screen.findByText('tableCard.loadWhenVisible')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tableCard.nextPage' })).not.toBeInTheDocument();
  });

  it('renders a literal value column label when the provided label is not a translation key', async () => {
    await setup({
      valueColumnLabelKey: '💍',
    });

    expect(await screen.findByText('💍')).toBeInTheDocument();
  });

  it('hides a dynamic description until translation params are available', async () => {
    const view = await setup({
      descriptionRequiresParams: true,
    });

    expect(
      screen.queryByText('career.highlights.cards.mostTeamsPlayed.description'),
    ).not.toBeInTheDocument();

    view.fixture.componentInstance.descriptionParams = { minAllowed: 4 };
    view.fixture.detectChanges();

    expect(
      screen.getByText('career.highlights.cards.mostTeamsPlayed.description'),
    ).toBeInTheDocument();
  });
});
