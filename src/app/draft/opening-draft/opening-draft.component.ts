import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

import { FooterVisibilityService } from '@services/footer-visibility.service';

@Component({
  selector: 'app-opening-draft',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, TranslateModule],
  templateUrl: './opening-draft.component.html',
  styleUrl: './opening-draft.component.scss',
})
export class OpeningDraftComponent implements OnInit {
  private readonly footerVisibilityService = inject(FooterVisibilityService);

  ngOnInit(): void {
    this.footerVisibilityService.markReady(this.footerVisibilityService.currentCycle());
  }
}
