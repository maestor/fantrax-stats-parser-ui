import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComparisonService } from '@services/comparison.service';
import { StatsContext } from '@shared/types/context.types';

@Component({
  selector: 'app-comparison-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, MatButtonModule, TranslateModule],
  templateUrl: './comparison-bar.component.html',
  styleUrl: './comparison-bar.component.scss',
})
export class ComparisonBarComponent implements OnChanges {
  @Input() context: StatsContext = 'player';
  private readonly comparisonService = inject(ComparisonService);
  private readonly translateService = inject(TranslateService);
  private readonly dialog = inject(MatDialog);

  readonly selection$ = this.comparisonService.selection$;

  readonly visible$: Observable<boolean> = this.selection$.pipe(
    map((s) => s.length > 0)
  );

  readonly showCompareButton$: Observable<boolean> = this.selection$.pipe(
    map((s) => s.length === 2)
  );

  readonly barText$: Observable<string> = this.selection$.pipe(
    map((selection) => {
      if (selection.length === 1) {
        return this.translateService.instant('comparison.selectedOne', { name: selection[0].name });
      }
      if (selection.length === 2) {
        return `${selection[0].name}, ${selection[1].name}`;
      }
      return '';
    })
  );

  ngOnChanges(changes: SimpleChanges): void {
    // Clear comparison when context changes (but not on initial load)
    if (changes['context'] && !changes['context'].firstChange) {
      this.comparisonService.clear();
    }
  }

  onClear(): void {
    this.comparisonService.clear();
  }

  async onCompare(): Promise<void> {
    const ordered = await firstValueFrom(this.comparisonService.orderedSelection$);

    if (!ordered) {
      return;
    }

    const { ComparisonDialogComponent } = await import(
      '@shared/comparison-dialog/comparison-dialog.component'
    );

    this.dialog.open(ComparisonDialogComponent, {
      data: { ...ordered, context: this.context },
      maxWidth: '95vw',
      width: 'auto',
      panelClass: 'comparison-dialog-panel',
    });
  }
}
