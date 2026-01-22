import { Component, ViewChild, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { FooterComponent } from '@base/footer/footer.component';
import { NavigationComponent } from './base/navigation/navigation.component';
import { TeamSelectorComponent } from '@shared/team-selector/team-selector.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    TranslateModule,
    MatTabsModule,
    FooterComponent,
    NavigationComponent,
    TeamSelectorComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private titleService = inject(Title);
  private translateService = inject(TranslateService);

  ngOnInit(): void {
    this.translateService.get('pageTitle').subscribe((name) => {
      this.titleService.setTitle(name);
    });
  }
}
