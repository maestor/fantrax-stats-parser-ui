import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, Season } from '@services/api.service';
import { FilterService } from '@services/filter.service';

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
  private filterService = inject(FilterService);

  seasons: Season[] = [];

  ngOnInit() {
    this.fetchSeasons();
  }

  fetchSeasons() {
    this.apiService.getSeasons().subscribe((data) => {
      this.seasons = data;
    });
  }

  changeSeason(event: MatSelectChange): void {
    this.filterService.updateSeason(event.value);
  }
}
