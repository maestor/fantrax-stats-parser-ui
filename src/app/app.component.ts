import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { FooterComponent } from '@base/footer/footer.component';
import { NavigationComponent } from './base/navigation/navigation.component';
import { TopControlsComponent } from '@shared/top-controls/top-controls.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TranslateModule,
    MatTabsModule,
    FooterComponent,
    NavigationComponent,
    TopControlsComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  controlsContext: 'player' | 'goalie' = 'player';

  private titleService = inject(Title);
  private translateService = inject(TranslateService);
  private router = inject(Router);

  ngOnInit(): void {
    this.translateService.get('pageTitle').subscribe((name) => {
      this.titleService.setTitle(name);
    });

    this.updateControlsContext(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateControlsContext(event.urlAfterRedirects);
      });
  }

  private updateControlsContext(url: string): void {
    this.controlsContext = url.includes('goalie-stats') ? 'goalie' : 'player';
  }
}
