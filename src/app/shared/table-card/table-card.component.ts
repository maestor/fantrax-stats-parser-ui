import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { TableCardRow } from './table-card.types';

let nextTableCardInstanceId = 0;

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
  styleUrls: [
    './table-card.component.scss',
    './table-card-actions.component.scss',
  ],
})
export class TableCardComponent {
  private readonly instanceId = `table-card-${nextTableCardInstanceId += 1}`;

  readonly titleKey = input.required<string>();
  readonly descriptionKey = input.required<string>();
  readonly descriptionRequiresParams = input(false);
  readonly descriptionParams = input<Readonly<Record<string, number | string>> | undefined>();
  readonly primaryColumnLabelKey = input.required<string>();
  readonly valueColumnLabelKey = input.required<string>();
  readonly valueColumnTooltipKey = input<string | undefined>();
  readonly valueColumnAriaLabelKey = input<string | undefined>();
  readonly showDetails = input(true);
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
  readonly hasDescription = computed(
    () => !this.descriptionRequiresParams() || Boolean(this.descriptionParams()),
  );
  readonly valueColumnAssistiveLabelKey = computed(
    () => this.valueColumnAriaLabelKey() ?? this.valueColumnTooltipKey(),
  );
  readonly hasValueColumnHelp = computed(
    () => Boolean(this.valueColumnAssistiveLabelKey()),
  );
  readonly valueColumnTooltipEnabled = computed(
    () => Boolean(this.valueColumnTooltipKey()),
  );
  readonly titleId = `${this.instanceId}-title`;
  readonly descriptionId = `${this.instanceId}-description`;
  readonly previousButtonTextId = `${this.instanceId}-previous-text`;
  readonly nextButtonTextId = `${this.instanceId}-next-text`;
  readonly tableAriaLabelledBy = computed(() => (
    this.hasDescription() ? `${this.titleId} ${this.descriptionId}` : this.titleId
  ));
  readonly previousButtonAriaLabelledBy = `${this.titleId} ${this.previousButtonTextId}`;
  readonly nextButtonAriaLabelledBy = `${this.titleId} ${this.nextButtonTextId}`;

  getDetailsTooltip(row: TableCardRow): string {
    const detailLines = row.detailLines ?? [];

    if (!row.detailHeader) {
      return detailLines.join('\n');
    }

    return [row.detailHeader, ...detailLines].join('\n');
  }

  getDetailsTooltipClass(row: TableCardRow): string[] {
    return ['table-card-tooltip', row.detailTooltipClass].filter(
      (className): className is string => Boolean(className),
    );
  }

  getDetailsAriaLabel(row: TableCardRow): string {
    return row.detailLabel ?? row.primaryText;
  }
}
