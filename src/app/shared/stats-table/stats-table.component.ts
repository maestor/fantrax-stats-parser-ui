import {
  ChangeDetectorRef,
  inject,
  Component,
  Input,
  ViewChild,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { STATIC_COLUMNS } from '@shared/table-columns';
import { Player, Goalie } from '@services/api.service';
import { PlayerCardComponent } from '@shared/player-card/player-card.component';

@Component({
  selector: 'app-stats-table',
  imports: [
    TranslateModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSortModule,
    MatTooltipModule,
  ],
  templateUrl: './stats-table.component.html',
  styleUrl: './stats-table.component.scss',
})
export class StatsTableComponent implements OnChanges, AfterViewInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);

  private warmupTimeoutId?: ReturnType<typeof setTimeout>;
  private loadingIntervalId?: ReturnType<typeof setInterval>;
  private loadingStartMs?: number;

  loadingProgress = 0;
  loadingBuffer = 0;
  showWarmupMessage = false;

  @Input() data: any = [];
  @Input() columns: string[] = [];
  @Input() defaultSortColumn = 'score';
  @Input() loading = false;
  @Input() apiError = false;

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [];
  dynamicColumns: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['loading']) {
      this.onLoadingChanged(this.loading);
    }

    if (changes['data'] && this.data) {
      this.dataSource.data = this.data;

      if (this.columns?.length > 0) {
        this.displayedColumns = this.columns;
        this.dynamicColumns = this.displayedColumns.filter(
          (column) => !STATIC_COLUMNS.includes(column)
        );
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }
  }

  ngOnDestroy(): void {
    this.clearWarmupTimer();
    this.clearLoadingProgressTimer();
  }

  private onLoadingChanged(isLoading: boolean) {
    this.clearWarmupTimer();
    this.clearLoadingProgressTimer();
    this.showWarmupMessage = false;

    if (!isLoading) {
      this.loadingProgress = 0;
      this.loadingBuffer = 0;
      return;
    }

    this.loadingStartMs = Date.now();
    this.updateLoadingProgress();
    this.loadingIntervalId = setInterval(() => {
      this.updateLoadingProgress();
      this.cdr.markForCheck();
    }, 200);

    this.warmupTimeoutId = setTimeout(() => {
      this.showWarmupMessage = true;
      this.cdr.markForCheck();
    }, 2000);
  }

  private updateLoadingProgress() {
    const elapsedMs = Math.max(0, Date.now() - (this.loadingStartMs ?? Date.now()));
    const expectedMs = 60_000;
    const progress = Math.min(100, Math.round((elapsedMs / expectedMs) * 100));
    const buffer = Math.min(100, progress + 15);

    this.loadingProgress = progress;
    this.loadingBuffer = buffer;
  }

  private clearLoadingProgressTimer() {
    if (this.loadingIntervalId) {
      clearInterval(this.loadingIntervalId);
      this.loadingIntervalId = undefined;
    }

    this.loadingStartMs = undefined;
  }

  private clearWarmupTimer() {
    if (this.warmupTimeoutId) {
      clearTimeout(this.warmupTimeoutId);
      this.warmupTimeoutId = undefined;
    }
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      this.sort.active = this.defaultSortColumn;
      this.sort.direction = 'desc';
    }

    this.cdr.detectChanges();
  }

  filterItems(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  selectItem(data: Player | Goalie) {
    this.dialog.open(PlayerCardComponent, {
      data,
      maxWidth: '95vw',
      width: 'auto',
      panelClass: 'player-card-dialog',
    });
  }
}
