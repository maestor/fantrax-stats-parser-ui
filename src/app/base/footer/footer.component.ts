import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  imports: [MatDividerModule, FontAwesomeModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly links: ReadonlyArray<{
    key: 'linkedin' | 'ui' | 'api';
    icon: IconDefinition;
  }> = [
    { key: 'linkedin', icon: faLinkedin },
    { key: 'ui', icon: faGithub },
    { key: 'api', icon: faGithub },
  ];
}
