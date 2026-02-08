import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { ComparisonService } from '@services/comparison.service';
import { ComparisonDialogComponent, ComparisonDialogData } from '@shared/comparison-dialog/comparison-dialog.component';

@Component({
  selector: 'app-comparison-bar',
  imports: [AsyncPipe, MatButtonModule, TranslateModule],
  templateUrl: './comparison-bar.component.html',
  styleUrl: './comparison-bar.component.scss',
})
export class ComparisonBarComponent implements OnChanges {
  @Input() context: 'player' | 'goalie' = 'player';
  private comparisonService = inject(ComparisonService);
  private translateService = inject(TranslateService);
  private dialog = inject(MatDialog);

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

  onCompare(): void {
    this.comparisonService.orderedSelection$.pipe(first()).subscribe((ordered) => {
      if (ordered) {
        const dialogData: ComparisonDialogData = { ...ordered, context: this.context };
        this.dialog.open(ComparisonDialogComponent, {
          data: dialogData,
          maxWidth: '95vw',
          width: 'auto',
          panelClass: 'comparison-dialog-panel',
        });
      }
    });
  }
}
