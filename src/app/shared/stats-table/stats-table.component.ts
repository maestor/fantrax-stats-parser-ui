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
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { STATIC_COLUMNS } from '@shared/table-columns';

@Component({
  selector: 'app-stats-table',
  imports: [
    CommonModule,
    TranslateModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSortModule,
  ],
  templateUrl: './stats-table.component.html',
  styleUrl: './stats-table.component.scss',
})
export class StatsTableComponent implements OnChanges, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

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
      this.dataSource = new MatTableDataSource(this.data);
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
    this.sort.sortChange.emit();

    this.cdr.detectChanges();
  }

  filterItems(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
