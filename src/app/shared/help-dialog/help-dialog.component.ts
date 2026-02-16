import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export type HelpDialogBlockType = 'h2' | 'h3' | 'p' | 'ul';

export interface HelpDialogBlock {
  type: HelpDialogBlockType;
  text?: string;
  items?: string[];
}

export interface HelpDialogModel {
  title: string;
  blocks: HelpDialogBlock[];
}

@Component({
  selector: 'app-help-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    TranslateModule,
  ],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
})
export class HelpDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<HelpDialogComponent>);
  private translateService = inject(TranslateService);

  model?: HelpDialogModel;

  readonly links: ReadonlyArray<{
    key: 'linkedin' | 'ui' | 'api';
    icon: IconDefinition;
  }> = [
      { key: 'linkedin', icon: faLinkedin },
      { key: 'ui', icon: faGithub },
      { key: 'api', icon: faGithub },
    ];

  ngOnInit(): void {
    this.translateService.get('helpDialog').subscribe((value) => {
      this.model = value as HelpDialogModel;
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
