import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, first } from 'rxjs/operators';
import { ComparisonService } from '@services/comparison.service';

@Component({
  selector: 'app-comparison-bar',
  imports: [AsyncPipe, MatButtonModule, TranslateModule],
  templateUrl: './comparison-bar.component.html',
  styleUrl: './comparison-bar.component.scss',
})
export class ComparisonBarComponent {
  private comparisonService = inject(ComparisonService);
  private translateService = inject(TranslateService);

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

  onClear(): void {
    this.comparisonService.clear();
  }

  onCompare(): void {
    this.comparisonService.orderedSelection$.pipe(first()).subscribe((ordered) => {
      if (ordered) {
        // ComparisonDialogComponent will be created in Task 6
        // For now, just log to verify wiring works
        console.log('Compare:', ordered.playerA.name, 'vs', ordered.playerB.name);
      }
    });
  }
}
