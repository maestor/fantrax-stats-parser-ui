import {
  DestroyRef,
  Component,
  ChangeDetectorRef,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  readonly tabPanel = input.required<MatTabNavPanel>();
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  navItems = [
    { label: 'link.playerStats', path: '/player-stats' },
    { label: 'link.goalieStats', path: '/goalie-stats' },
  ];
  activeLink = '';

  ngOnInit(): void {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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

  setActiveTab(path: string): void {
    this.activeLink = path;
    this.cdr.detectChanges();
  }
}
