import { TestBed } from '@angular/core/testing';
import { ComparisonService } from '../comparison.service';
import { Player, Goalie } from '../api.service';
import { first } from 'rxjs';
import { TeamService } from '../team.service';
import { FilterService } from '../filter.service';
import { SettingsService } from '../settings.service';
import { StatsService } from '../stats.service';

const mockPlayerA: Player = {
    name: 'Mikko Rantanen',
    position: 'F',
    score: 94.31,
    scoreAdjustedByGames: 93.1,
    games: 427,
    goals: 193,
    assists: 254,
    points: 447,
    plusMinus: 0,
    penalties: 256,
    shots: 1182,
    ppp: 165,
    shp: 0,
    hits: 276,
    blocks: 41,
};

const mockPlayerB: Player = {
    name: 'Aaron Ekblad',
    position: 'D',
    score: 100,
    scoreAdjustedByGames: 67.22,
    games: 540,
    goals: 100,
    assists: 188,
    points: 288,
    plusMinus: 40,
    penalties: 355,
    shots: 1413,
    ppp: 94,
    shp: 6,
    hits: 582,
    blocks: 574,
};

const mockPlayerC: Player = {
    name: 'Jason Zucker',
    position: 'F',
    score: 71.58,
    scoreAdjustedByGames: 58.64,
    games: 448,
    goals: 132,
    assists: 110,
    points: 242,
    plusMinus: 26,
    penalties: 169,
    shots: 1038,
    ppp: 41,
    shp: 5,
    hits: 496,
    blocks: 0,
};

const mockGoalieA: Goalie = {
    name: 'Juuse Saros',
    score: 95.5,
    scoreAdjustedByGames: 88.2,
    games: 180,
    wins: 98,
    saves: 4850,
    shutouts: 12,
    goals: 0,
    assists: 3,
    points: 3,
    penalties: 4,
    ppp: 0,
    shp: 0,
};

const mockGoalieB: Goalie = {
    name: 'Andrei Vasilevskiy',
    score: 100,
    scoreAdjustedByGames: 92.1,
    games: 220,
    wins: 135,
    saves: 6100,
    shutouts: 18,
    goals: 0,
    assists: 5,
    points: 5,
    penalties: 6,
    ppp: 0,
    shp: 0,
};

describe('ComparisonService', () => {
    let service: ComparisonService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(ComparisonService);
    });

    describe('initial state', () => {
        it('should start with empty selection', async () => {
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection).toEqual([]);

            });
        });

        it('should report canSelectMore as true', async () => {
            service.canSelectMore$.pipe(first()).subscribe((canSelect) => {
                expect(canSelect).toBe(true);

            });
        });
    });

    describe('toggle', () => {
        it('should add a player to selection', async () => {
            service.toggle(mockPlayerA);
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection.length).toBe(1);
                expect(selection[0].name).toBe('Mikko Rantanen');

            });
        });

        it('should remove a player that is already selected', async () => {
            service.toggle(mockPlayerA);
            service.toggle(mockPlayerA);
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection).toEqual([]);

            });
        });

        it('should allow selecting two players', async () => {
            service.toggle(mockPlayerA);
            service.toggle(mockPlayerB);
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection.length).toBe(2);

            });
        });

        it('should not allow selecting more than two players', async () => {
            service.toggle(mockPlayerA);
            service.toggle(mockPlayerB);
            service.toggle(mockPlayerC);
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection.length).toBe(2);

            });
        });

        it('should report canSelectMore as false when two are selected', async () => {
            service.toggle(mockPlayerA);
            service.toggle(mockPlayerB);
            service.canSelectMore$.pipe(first()).subscribe((canSelect) => {
                expect(canSelect).toBe(false);

            });
        });
    });

    describe('isSelected', () => {
        it('should return true for a selected player', () => {
            service.toggle(mockPlayerA);
            expect(service.isSelected(mockPlayerA)).toBe(true);
        });

        it('should return false for an unselected player', () => {
            expect(service.isSelected(mockPlayerA)).toBe(false);
        });
    });

    describe('clear', () => {
        it('should remove all selections', async () => {
            service.toggle(mockPlayerA);
            service.toggle(mockPlayerB);
            service.clear();
            service.selection$.pipe(first()).subscribe((selection) => {
                expect(selection).toEqual([]);

            });
        });
    });

    describe('orderedSelection', () => {
        it('should return player with higher FR as playerA', async () => {
            service.toggle(mockPlayerA); // FR 94.31
            service.toggle(mockPlayerB); // FR 100
            service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                expect(ordered).not.toBeNull();
                expect(ordered!.playerA.name).toBe('Aaron Ekblad');
                expect(ordered!.playerB.name).toBe('Mikko Rantanen');

            });
        });

        it('should return null when fewer than 2 selected', async () => {
            service.toggle(mockPlayerA);
            service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                expect(ordered).toBeNull();

            });
        });

        it('should keep order when first selected has higher score', async () => {
            service.toggle(mockPlayerB); // FR 100 (higher)
            service.toggle(mockPlayerA); // FR 94.31
            service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                expect(ordered).not.toBeNull();
                expect(ordered!.playerA.name).toBe('Aaron Ekblad');
                expect(ordered!.playerB.name).toBe('Mikko Rantanen');

            });
        });

        describe('with statsPerGame', () => {
            let filterService: FilterService;
            let statsService: StatsService;

            beforeEach(() => {
                filterService = TestBed.inject(FilterService);
                statsService = TestBed.inject(StatsService);
            });

            it('should transform players when statsPerGame is true', async () => {
                // Create per-game transformed players with different scores
                const mockPlayerAPerGame: Player = {
                    ...mockPlayerA,
                    score: 1.2, // Per-game score
                    goals: 0.45,
                    assists: 0.59,
                    points: 1.04,
                };

                const mockPlayerBPerGame: Player = {
                    ...mockPlayerB,
                    score: 0.9, // Per-game score (lower)
                    goals: 0.18,
                    assists: 0.35,
                    points: 0.53,
                };

                vi.spyOn(statsService, 'getPlayerStatsPerGame').mockImplementation((players) => {
                    if (players[0].name === 'Mikko Rantanen') {
                        return [mockPlayerAPerGame];
                    }
                    return [mockPlayerBPerGame];
                });

                filterService.updatePlayerFilters({ statsPerGame: true });
                service.toggle(mockPlayerA);
                service.toggle(mockPlayerB);

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    expect(statsService.getPlayerStatsPerGame).toHaveBeenCalled();
                    // PlayerA should be first because it has higher per-game score
                    expect(ordered!.playerA.score).toBe(1.2);
                    expect(ordered!.playerB.score).toBe(0.9);

                });
            });

            it('should not transform players when statsPerGame is false', async () => {
                vi.spyOn(statsService, 'getPlayerStatsPerGame');

                filterService.updatePlayerFilters({ statsPerGame: false });
                service.toggle(mockPlayerA);
                service.toggle(mockPlayerB);

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    expect(statsService.getPlayerStatsPerGame).not.toHaveBeenCalled();
                    // Should use original scores
                    expect(ordered!.playerA.score).toBe(100); // mockPlayerB
                    expect(ordered!.playerB.score).toBe(94.31); // mockPlayerA

                });
            });

            it('should order by score after per-game transformation', async () => {
                // PlayerA has higher total score but lower per-game score
                const mockPlayerAPerGame: Player = {
                    ...mockPlayerA,
                    score: 0.5, // Lower per-game score
                };

                const mockPlayerBPerGame: Player = {
                    ...mockPlayerB,
                    score: 1.8, // Higher per-game score
                };

                vi.spyOn(statsService, 'getPlayerStatsPerGame').mockImplementation((players) => {
                    if (players[0].name === 'Mikko Rantanen') {
                        return [mockPlayerAPerGame];
                    }
                    return [mockPlayerBPerGame];
                });

                filterService.updatePlayerFilters({ statsPerGame: true });
                service.toggle(mockPlayerA); // Higher total score (94.31)
                service.toggle(mockPlayerB); // Lower total score but higher per-game

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    // PlayerB should be first because it has higher per-game score
                    expect(ordered!.playerA.name).toBe('Aaron Ekblad');
                    expect(ordered!.playerA.score).toBe(1.8);
                    expect(ordered!.playerB.name).toBe('Mikko Rantanen');
                    expect(ordered!.playerB.score).toBe(0.5);

                });
            });

            it('should transform goalies when statsPerGame is true', async () => {
                // Create per-game transformed goalies with different scores
                const mockGoalieAPerGame: Goalie = {
                    ...mockGoalieA,
                    score: 1.5, // Per-game score
                    wins: 0.54,
                    saves: 26.9,
                };

                const mockGoalieBPerGame: Goalie = {
                    ...mockGoalieB,
                    score: 1.1, // Per-game score (lower)
                    wins: 0.61,
                    saves: 27.7,
                };

                vi.spyOn(statsService, 'getGoalieStatsPerGame').mockImplementation((goalies) => {
                    if (goalies[0].name === 'Juuse Saros') {
                        return [mockGoalieAPerGame];
                    }
                    return [mockGoalieBPerGame];
                });

                filterService.updateGoalieFilters({ statsPerGame: true });
                service.toggle(mockGoalieA);
                service.toggle(mockGoalieB);

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    expect(statsService.getGoalieStatsPerGame).toHaveBeenCalled();
                    // GoalieA should be first because it has higher per-game score
                    expect(ordered!.playerA.name).toBe('Juuse Saros');
                    expect(ordered!.playerA.score).toBe(1.5);
                    expect(ordered!.playerB.name).toBe('Andrei Vasilevskiy');
                    expect(ordered!.playerB.score).toBe(1.1);

                });
            });

            it('should not transform goalies when statsPerGame is false', async () => {
                vi.spyOn(statsService, 'getGoalieStatsPerGame');

                filterService.updateGoalieFilters({ statsPerGame: false });
                service.toggle(mockGoalieA);
                service.toggle(mockGoalieB);

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    expect(statsService.getGoalieStatsPerGame).not.toHaveBeenCalled();
                    // Should use original scores
                    expect(ordered!.playerA.score).toBe(100); // mockGoalieB
                    expect(ordered!.playerB.score).toBe(95.5); // mockGoalieA

                });
            });

            it('should order goalies by score after per-game transformation', async () => {
                // GoalieB has higher total score but lower per-game score
                const mockGoalieAPerGame: Goalie = {
                    ...mockGoalieA,
                    score: 2.2, // Higher per-game score
                };

                const mockGoalieBPerGame: Goalie = {
                    ...mockGoalieB,
                    score: 0.8, // Lower per-game score
                };

                vi.spyOn(statsService, 'getGoalieStatsPerGame').mockImplementation((goalies) => {
                    if (goalies[0].name === 'Juuse Saros') {
                        return [mockGoalieAPerGame];
                    }
                    return [mockGoalieBPerGame];
                });

                filterService.updateGoalieFilters({ statsPerGame: true });
                service.toggle(mockGoalieA); // Lower total score but higher per-game
                service.toggle(mockGoalieB); // Higher total score (100)

                service.orderedSelection$.pipe(first()).subscribe((ordered) => {
                    expect(ordered).not.toBeNull();
                    // GoalieA should be first because it has higher per-game score
                    expect(ordered!.playerA.name).toBe('Juuse Saros');
                    expect(ordered!.playerA.score).toBe(2.2);
                    expect(ordered!.playerB.name).toBe('Andrei Vasilevskiy');
                    expect(ordered!.playerB.score).toBe(0.8);

                });
            });
        });
    });

    describe('clearOnDataChange', () => {
        let teamService: TeamService;
        let filterService: FilterService;
        let settingsService: SettingsService;

        beforeEach(() => {
            teamService = TestBed.inject(TeamService);
            filterService = TestBed.inject(FilterService);
            settingsService = TestBed.inject(SettingsService);
        });

        it('should clear selection when team changes', async () => {
            service.toggle(mockPlayerA);
            teamService.setTeamId('99');
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should clear selection when player report type changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updatePlayerFilters({ reportType: 'playoffs' });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should clear selection when goalie report type changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updateGoalieFilters({ reportType: 'playoffs' });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should clear selection when player season changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updatePlayerFilters({ season: 2024 });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should clear selection when goalie season changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updateGoalieFilters({ season: 2024 });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should clear selection when startFromSeason changes', async () => {
            service.toggle(mockPlayerA);
            settingsService.setStartFromSeason(2020);
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s).toEqual([]);

            });
        });

        it('should not clear selection when minGames changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updatePlayerFilters({ minGames: 10 });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s.length).toBe(1);

            });
        });

        it('should not clear selection when statsPerGame changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updatePlayerFilters({ statsPerGame: true });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s.length).toBe(1);

            });
        });

        it('should not clear selection when positionFilter changes', async () => {
            service.toggle(mockPlayerA);
            filterService.updatePlayerFilters({ positionFilter: 'F' });
            service.selection$.pipe(first()).subscribe((s) => {
                expect(s.length).toBe(1);

            });
        });
    });
});
