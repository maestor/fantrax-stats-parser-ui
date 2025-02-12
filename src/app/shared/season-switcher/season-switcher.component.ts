import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, Season } from '@services/api.service';

@Component({
  selector: 'app-season-switcher',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
  ],
  templateUrl: './season-switcher.component.html',
  styleUrl: './season-switcher.component.scss',
})
export class SeasonSwitcherComponent implements OnInit {
  private apiService = inject(ApiService);

  @Output() changeSeasonEvent = new EventEmitter<number>();

  seasons: Season[] = [];

  ngOnInit() {
    this.fetchSeasons();
  }

  fetchSeasons() {
    this.apiService.getSeasons().subscribe((data) => {
      this.seasons = data;
    });
  }

  onChangeSeason(event: MatSelectChange): void {
    this.changeSeasonEvent.emit(event.value);
  }
}
