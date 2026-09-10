import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-draft',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ...TRANSLATE_IMPORTS, MatTabsModule],
  templateUrl: './draft.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './draft.component.scss',
})
export class DraftComponent {
  readonly tabs = [
    { label: 'draft.tabs.entryDrafts', path: '/draft/entry-drafts' },
    { label: 'draft.tabs.openingDraft', path: '/draft/opening-draft' },
    { label: 'draft.tabs.statistics', path: '/draft/statistics' },
  ];
}
