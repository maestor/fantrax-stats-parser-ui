import { Component, DestroyRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-draft',
  imports: [RouterLink, RouterOutlet, TranslateModule, MatTabsModule],
  templateUrl: './draft.component.html',
  styleUrl: './draft.component.scss',
})
export class DraftComponent {
  @ViewChild('tabPanel') tabPanel!: MatTabNavPanel;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  activeLink = '';

  readonly tabs = [
    { label: 'draft.tabs.entryDrafts', path: '/draft/entry-drafts' },
    { label: 'draft.tabs.openingDraft', path: '/draft/opening-draft' },
  ];

  constructor() {
    this.syncActiveLink();

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncActiveLink());
  }

  private syncActiveLink(): void {
    this.activeLink = this.router.url.split('?')[0];
  }
}
