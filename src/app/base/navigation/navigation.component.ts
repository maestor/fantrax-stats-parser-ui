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
      this.activeLink = this.router.url;
      this.cdr.detectChanges();
    });
  }

  setActiveTab(path: string) {
    this.activeLink = path;
    this.cdr.detectChanges();
  }
}
