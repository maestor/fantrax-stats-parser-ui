import { Component, ViewChild, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-career',
  standalone: true,
  imports: [RouterLink, RouterOutlet, TranslateModule, MatTabsModule],
  templateUrl: './career.component.html',
  styleUrl: './career.component.scss',
})
export class CareerComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  activeLink = '';

  readonly tabs = [
    { label: 'career.tabs.players', path: '/career/players' },
    { label: 'career.tabs.goalies', path: '/career/goalies' },
  ];

  ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.activeLink = this.router.url.split('?')[0];
      this.cdr.detectChanges();
    });
    this.activeLink = this.router.url.split('?')[0];
  }
}
