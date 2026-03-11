import { ChangeDetectorRef, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-career',
  imports: [RouterLink, RouterOutlet, TranslateModule, MatTabsModule],
  templateUrl: './career.component.html',
  styleUrl: './career.component.scss',
})
export class CareerComponent implements OnInit {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  activeLink = '';

  readonly tabs = [
    { label: 'career.tabs.players', path: '/career/players' },
    { label: 'career.tabs.goalies', path: '/career/goalies' },
    { label: 'career.tabs.highlights', path: '/career/highlights' },
  ];

  ngOnInit(): void {
    this.activeLink = this.router.url.split('?')[0];

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.activeLink = this.router.url.split('?')[0];
        this.cdr.detectChanges();
      });
  }
}
