import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsPanelComponent } from './settings-panel.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

describe('SettingsPanelComponent', () => {
  let component: SettingsPanelComponent;
  let fixture: ComponentFixture<SettingsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SettingsPanelComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all child control components', () => {
    const statsModeToggle = fixture.debugElement.query(
      By.directive(StatsModeToggleComponent)
    );
    const minGamesSlider = fixture.debugElement.query(
      By.directive(MinGamesSliderComponent)
    );

    expect(statsModeToggle).toBeTruthy();
    expect(minGamesSlider).toBeTruthy();
  });

  it('should pass context and maxGames inputs down to children', () => {
    component.context = 'goalie';
    component.maxGames = 82;
    fixture.detectChanges();

    const statsModeToggle = fixture.debugElement.query(
      By.directive(StatsModeToggleComponent)
    ).componentInstance as StatsModeToggleComponent;
    const minGamesSlider = fixture.debugElement.query(
      By.directive(MinGamesSliderComponent)
    ).componentInstance as MinGamesSliderComponent;

    expect(statsModeToggle.context).toBe('goalie');
    expect(minGamesSlider.context).toBe('goalie');
    expect(minGamesSlider.maxGames).toBe(82);
  });

  describe('Mobile toggle functionality', () => {
    it('should initialize with isExpanded set to false', () => {
      expect(component.isExpanded).toBe(false);
    });

    it('should toggle isExpanded when toggleExpanded is called', () => {
      expect(component.isExpanded).toBe(false);

      component.toggleExpanded();
      expect(component.isExpanded).toBe(true);

      component.toggleExpanded();
      expect(component.isExpanded).toBe(false);
    });

    it('should render toggle button', () => {
      const toggleButton = fixture.debugElement.query(
        By.css('.control-panel-toggle')
      );
      expect(toggleButton).toBeTruthy();
    });

    it('should render control panel content', () => {
      const content = fixture.debugElement.query(
        By.css('.control-panel-content')
      );
      expect(content).toBeTruthy();
    });

    it('should add expanded class to content when isExpanded is true', () => {
      component.isExpanded = true;
      fixture.detectChanges();

      const content = fixture.debugElement.query(
        By.css('.control-panel-content')
      );
      expect(content.nativeElement.classList.contains('expanded')).toBe(true);
    });

    it('should remove expanded class from content when isExpanded is false', () => {
      component.isExpanded = false;
      fixture.detectChanges();

      const content = fixture.debugElement.query(
        By.css('.control-panel-content')
      );
      expect(content.nativeElement.classList.contains('expanded')).toBe(false);
    });

    it('should toggle content when button is clicked', () => {
      const toggleButton = fixture.debugElement.query(
        By.css('.control-panel-toggle')
      );
      const content = fixture.debugElement.query(
        By.css('.control-panel-content')
      );

      expect(component.isExpanded).toBe(false);
      expect(content.nativeElement.classList.contains('expanded')).toBe(false);

      toggleButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.isExpanded).toBe(true);
      expect(content.nativeElement.classList.contains('expanded')).toBe(true);

      toggleButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.isExpanded).toBe(false);
      expect(content.nativeElement.classList.contains('expanded')).toBe(false);
    });

    it('should show correct icon when collapsed (default)', () => {
      component.isExpanded = false;
      fixture.detectChanges();

      const toggleIcon = fixture.debugElement.query(
        By.css('.toggle-icon')
      );
      expect(toggleIcon.nativeElement.textContent).toContain('▼');
    });

    it('should show correct icon when expanded', () => {
      component.isExpanded = true;
      fixture.detectChanges();

      const toggleIcon = fixture.debugElement.query(
        By.css('.toggle-icon')
      );
      expect(toggleIcon.nativeElement.textContent).toContain('▲');
    });

    it('should set aria-expanded attribute correctly', () => {
      const toggleButton = fixture.debugElement.query(
        By.css('.control-panel-toggle')
      );

      component.isExpanded = true;
      fixture.detectChanges();
      expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('true');

      component.isExpanded = false;
      fixture.detectChanges();
      expect(toggleButton.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
