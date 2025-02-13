import { Component } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-stats-mode-toggle',
  imports: [MatSlideToggleModule],
  templateUrl: './stats-mode-toggle.component.html',
  styleUrl: './stats-mode-toggle.component.scss',
})
export class StatsModeToggleComponent {}
