import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-footer',
  imports: [MatDividerModule],
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
