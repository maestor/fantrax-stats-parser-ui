import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    translate = TestBed.inject(TranslateService);

    translate.setTranslation(
      'fi',
      {
        footer: {
          copyright: 'Copyright © Kalle Haavisto 2025->',
          links: {
            ariaLabel: 'Sosiaaliset linkit',
            linkedin: {
              label: 'LinkedIn',
              href: 'https://www.linkedin.com/in/khaavisto/',
            },
            ui: {
              label: 'UI',
              href: 'https://github.com/maestor/fantrax-stats-parser-ui',
            },
            api: {
              label: 'API',
              href: 'https://github.com/maestor/node-fantrax-stats-parser',
            },
          },
        },
      },
      true
    );
    translate.use('fi');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the footer template', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-divider')).toBeTruthy();
  });

  it('should render three social links with correct hrefs', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll('a.footer-link'));

    expect(links.length).toBe(3);
    expect(links[0].getAttribute('href')).toBe(
      'https://www.linkedin.com/in/khaavisto/'
    );
    expect(links[1].getAttribute('href')).toBe(
      'https://github.com/maestor/fantrax-stats-parser-ui'
    );
    expect(links[2].getAttribute('href')).toBe(
      'https://github.com/maestor/node-fantrax-stats-parser'
    );
  });

  it('should render an icon for each social link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('a.footer-link fa-icon');
    expect(icons.length).toBe(3);
  });

  it('should be a standalone component', () => {
    expect(component).toBeInstanceOf(FooterComponent);
  });
});
