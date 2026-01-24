import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, TranslateModule, MatTabsModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent implements OnInit {
  @Input() tabPanel!: MatTabNavPanel;
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  navItems = [
    { label: 'link.playerStats', path: '/player-stats' },
    { label: 'link.goalieStats', path: '/goalie-stats' },
  ];
  activeLink = '';

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.activeLink = this.normalizeActiveLink(this.router.url);
      this.cdr.detectChanges();
    });
  }

  private normalizeActiveLink(url: string): string {
    // The root route renders the player stats view; map it so the tab highlight matches.
    if (url === '/' || url === '') {
      return '/player-stats';
    }
    return url;
  }

  setActiveTab(path: string) {
    this.activeLink = path;
    this.cdr.detectChanges();
  }
}
