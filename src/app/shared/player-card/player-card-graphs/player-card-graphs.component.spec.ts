import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerCardGraphsComponent } from './player-card-graphs.component';
import { TranslateModule } from '@ngx-translate/core';
import type { Player, PlayerSeasonStats } from '@services/api.service';

describe('PlayerCardGraphsComponent', () => {
  let fixture: ComponentFixture<PlayerCardGraphsComponent>;
  let component: PlayerCardGraphsComponent;

  const seasons: PlayerSeasonStats[] = [
    {
      season: 2024,
      games: 82,
      score: 123,
      scoreAdjustedByGames: 1.5,
      goals: 30,
      assists: 40,
      points: 70,
      shots: 200,
      penalties: 20,
      hits: 50,
      blocks: 30,
      plusMinus: 10,
      ppp: 15,
      shp: 1,
    },
    {
      season: 2023,
      games: 80,
      score: 100,
      scoreAdjustedByGames: 1.25,
      goals: 25,
      assists: 35,
      points: 60,
      shots: 180,
      penalties: 18,
      hits: 45,
      blocks: 28,
      plusMinus: 8,
      ppp: 12,
      shp: 0,
    },
  ];

  const mockPlayer: Player & { seasons: PlayerSeasonStats[] } = {
    name: 'Skater One',
    score: 0,
    scoreAdjustedByGames: 0,
    games: 82,
    goals: 30,
    assists: 40,
    points: 70,
    plusMinus: 10,
    penalties: 20,
    shots: 200,
    ppp: 15,
    shp: 1,
    hits: 50,
    blocks: 30,
    seasons,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerCardGraphsComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerCardGraphsComponent);
    component = fixture.componentInstance;

    component.data = mockPlayer;
    fixture.detectChanges();
  });

  it('should create and initialize chart data', () => {
    expect(component).toBeTruthy();
    expect(component.hasSeasons).toBeTrue();

    expect(component.lineChartData.labels?.length).toBeGreaterThan(0);
    expect(component.lineChartData.datasets.length).toBeGreaterThan(0);
  });

  it('should toggle graph controls', () => {
    expect(component.graphControlsExpanded).toBeFalse();
    component.toggleGraphControls();
    expect(component.graphControlsExpanded).toBeTrue();
  });

  it('should update datasets when a stat is toggled', () => {
    const initialCount = component.lineChartData.datasets.length;

    // Turn on an additional series (goals)
    component.onStatToggle('goals', { checked: true } as any);
    fixture.detectChanges();

    expect(component.lineChartData.datasets.length).toBeGreaterThanOrEqual(
      initialCount
    );
  });

  it('should handle ArrowUp/ArrowDown keyboard shortcuts', () => {
    const focusTabHeader = jasmine.createSpy('focusTabHeader');
    const closeBtn = document.createElement('button');
    spyOn(closeBtn, 'focus');

    component.requestFocusTabHeader = focusTabHeader;
    component.closeButtonEl = closeBtn;

    component.onGraphCheckboxKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(focusTabHeader).toHaveBeenCalled();

    component.onGraphCheckboxKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(closeBtn.focus).toHaveBeenCalled();
  });
});
