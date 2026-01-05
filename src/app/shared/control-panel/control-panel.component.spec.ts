import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlPanelComponent } from './control-panel.component';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ReportSwitcherComponent } from './report-switcher/report-switcher.component';
import { SeasonSwitcherComponent } from './season-switcher/season-switcher.component';
import { StatsModeToggleComponent } from './stats-mode-toggle/stats-mode-toggle.component';
import { MinGamesSliderComponent } from './min-games-slider/min-games-slider.component';

describe('ControlPanelComponent', () => {
  let component: ControlPanelComponent;
  let fixture: ComponentFixture<ControlPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ControlPanelComponent,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all child control components', () => {
    const reportSwitcher = fixture.debugElement.query(
      By.directive(ReportSwitcherComponent)
    );
    const seasonSwitcher = fixture.debugElement.query(
      By.directive(SeasonSwitcherComponent)
    );
    const statsModeToggle = fixture.debugElement.query(
      By.directive(StatsModeToggleComponent)
    );
    const minGamesSlider = fixture.debugElement.query(
      By.directive(MinGamesSliderComponent)
    );

    expect(reportSwitcher).toBeTruthy();
    expect(seasonSwitcher).toBeTruthy();
    expect(statsModeToggle).toBeTruthy();
    expect(minGamesSlider).toBeTruthy();
  });

  it('should pass context and maxGames inputs down to children', () => {
    component.context = 'goalie';
    component.maxGames = 82;
    fixture.detectChanges();

    const reportSwitcher = fixture.debugElement.query(
      By.directive(ReportSwitcherComponent)
    ).componentInstance as ReportSwitcherComponent;
    const seasonSwitcher = fixture.debugElement.query(
      By.directive(SeasonSwitcherComponent)
    ).componentInstance as SeasonSwitcherComponent;
    const statsModeToggle = fixture.debugElement.query(
      By.directive(StatsModeToggleComponent)
    ).componentInstance as StatsModeToggleComponent;
    const minGamesSlider = fixture.debugElement.query(
      By.directive(MinGamesSliderComponent)
    ).componentInstance as MinGamesSliderComponent;

    expect(reportSwitcher.context).toBe('goalie');
    expect(seasonSwitcher.context).toBe('goalie');
    expect(statsModeToggle.context).toBe('goalie');
    expect(minGamesSlider.context).toBe('goalie');
    expect(minGamesSlider.maxGames).toBe(82);
  });
});
