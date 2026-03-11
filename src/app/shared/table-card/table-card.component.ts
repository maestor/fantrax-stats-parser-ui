import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { TableCardRow } from './table-card.types';

@Component({
  selector: 'app-table-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './table-card.component.html',
  styleUrl: './table-card.component.scss',
})
export class TableCardComponent {
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input.required<string>();
  readonly primaryColumnLabelKey = input.required<string>();
  readonly valueColumnLabelKey = input.required<string>();
  readonly deferred = input(false);
  readonly rows = input.required<readonly TableCardRow[]>();
  readonly loading = input(false);
  readonly apiError = input(false);
  readonly skip = input(0);
  readonly take = input(10);
  readonly total = input(0);

  readonly previousPageRequested = output<void>();
  readonly nextPageRequested = output<void>();

  readonly hasRows = computed(() => this.rows().length > 0);
  readonly hasPreviousPage = computed(() => this.skip() > 0);
  readonly hasNextPage = computed(() => this.skip() + this.rows().length < this.total());
  readonly pageStart = computed(() => (this.hasRows() ? this.skip() + 1 : 0));
  readonly pageEnd = computed(() => (this.hasRows() ? this.skip() + this.rows().length : 0));

  getDetailsTooltip(row: TableCardRow): string {
    return row.detailLines.join('\n');
  }
}
