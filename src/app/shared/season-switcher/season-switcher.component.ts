import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService, Season } from '@services/api.service';

@Component({
  selector: 'app-season-switcher',
  imports: [MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './season-switcher.component.html',
  styleUrl: './season-switcher.component.scss',
})
export class SeasonSwitcherComponent implements OnInit {
  private apiService = inject(ApiService);

  seasons: Season[] = [];

  ngOnInit() {
    this.fetchSeasons();
  }

  fetchSeasons() {
    this.apiService.getSeasons().subscribe((data) => {
      this.seasons = data;
    });
  }
}
