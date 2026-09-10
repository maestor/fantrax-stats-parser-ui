import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-career',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ...TRANSLATE_IMPORTS, MatTabsModule],
  templateUrl: './career.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './career.component.scss',
})
export class CareerComponent {
  readonly tabs = [
    { label: 'career.tabs.players', path: '/career/players' },
    { label: 'career.tabs.goalies', path: '/career/goalies' },
    { label: 'career.tabs.highlights', path: '/career/highlights' },
  ];
}
