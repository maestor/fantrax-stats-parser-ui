import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

import { FooterVisibilityService } from '@services/footer-visibility.service';

@Component({
  selector: 'app-entry-drafts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, TranslateModule],
  templateUrl: './entry-drafts.component.html',
  styleUrl: './entry-drafts.component.scss',
})
export class EntryDraftsComponent implements OnInit {
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  ngOnInit(): void {
    this.footerVisibilityService.markReady(this.footerVisibilityService.currentCycle());
  }
}
