import { Component, Input, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TeamSwitcherComponent } from './team-switcher/team-switcher.component';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';

@Component({
  selector: 'app-top-controls',
  imports: [
    TranslateModule,
    TeamSwitcherComponent,
    SeasonSwitcherComponent,
    ReportSwitcherComponent,
  ],
  templateUrl: './top-controls.component.html',
  styleUrl: './top-controls.component.scss',
})
export class TopControlsComponent implements OnInit {
  @Input() context: 'player' | 'goalie' = 'player';

  isExpanded = true;

  private readonly storageKey = 'fantrax.topControls.expanded';

  ngOnInit(): void {
    this.isExpanded = this.readExpanded();
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.writeExpanded(this.isExpanded);
  }

  private readExpanded(): boolean {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored === null) return true;
      return stored === 'true';
    } catch {
      return true;
    }
  }

  private writeExpanded(expanded: boolean): void {
    try {
      localStorage.setItem(this.storageKey, String(expanded));
    } catch {
      // Ignore storage issues (private mode, SSR, etc.)
    }
  }
}
