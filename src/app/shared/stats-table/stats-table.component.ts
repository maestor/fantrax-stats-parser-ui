import {
  ChangeDetectorRef,
  inject,
  Component,
  Input,
  ViewChild,
  SimpleChanges,
  OnChanges,
  AfterViewInit,
} from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
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
    MatProgressSpinnerModule,
    MatSortModule
],
  templateUrl: './stats-table.component.html',
  styleUrl: './stats-table.component.scss',
})
export class StatsTableComponent implements OnChanges, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  readonly dialog = inject(MatDialog);

  @Input() data: any = [];
  @Input() columns: string[] = [];
  @Input() defaultSortColumn = 'games';
  @Input() loading = false;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = [];
  dynamicColumns: string[] = [];

  @ViewChild(MatSort) sort!: MatSort;

  ngOnChanges(changes: SimpleChanges) {
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

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = this.defaultSortColumn;
    this.sort.direction = 'desc';

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
      panelClass: 'player-card-dialog'
    });
  }
}
