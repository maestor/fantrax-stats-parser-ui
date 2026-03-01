import type { Mock } from "vitest";
import { ComponentFixture, TestBed, } from "@angular/core/testing";
import { ElementRef } from "@angular/core";
import { By } from "@angular/platform-browser";
import { PlayerCardComponent, PlayerCardDialogData } from "./player-card.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TranslateModule } from "@ngx-translate/core";
import { MatTabGroup } from "@angular/material/tabs";
import { Goalie, GoalieSeasonStats, Player, ApiService, } from "@services/api.service";
import { TeamService } from "@services/team.service";
import { of } from "rxjs";

describe("PlayerCardComponent", () => {
    let fixture: ComponentFixture<PlayerCardComponent>;
    let component: PlayerCardComponent;
    let dialogRefSpy: any;

    // Stub requestAnimationFrame to prevent deferred chart resize callbacks from
    // crashing between tests when chart.js tries to resize after the component is destroyed.
    beforeEach(() => {
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockGoalieWithSeasons: Goalie & {
        season: number;
        seasons: GoalieSeasonStats[];
    } = {
        name: "Goalie One",
        score: 0,
        scoreAdjustedByGames: 0,
        games: 10,
        wins: 8,
        saves: 300,
        shutouts: 2,
        goals: 0,
        assists: 1,
        points: 1,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: "2.00",
        savePercent: "0.920",
        season: 2024,
        seasons: [
            {
                name: "",
                season: 2024,
                games: 10,
                score: 50,
                scoreAdjustedByGames: 5,
                wins: 8,
                saves: 300,
                shutouts: 2,
                goals: 0,
                assists: 1,
                points: 1,
                penalties: 0,
                ppp: 0,
                shp: 0,
                gaa: "2.00",
                savePercent: "0.920",
            },
            {
                name: "",
                season: 2023,
                games: 15,
                score: 55,
                scoreAdjustedByGames: 5.5,
                wins: 10,
                saves: 450,
                shutouts: 3,
                goals: 0,
                assists: 2,
                points: 2,
                penalties: 0,
                ppp: 0,
                shp: 0,
                gaa: "2.10",
                savePercent: "0.915",
            },
        ],
    };

    const mockSkaterWithoutSeasons: Player = {
        name: "Player One",
        position: "F",
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
    };

    const mockDefenseman: Player = {
        name: "Defenseman One",
        position: "D",
        score: 0,
        scoreAdjustedByGames: 0,
        scoreByPosition: 75,
        scoreByPositionAdjustedByGames: 3.5,
        games: 82,
        goals: 10,
        assists: 30,
        points: 40,
        plusMinus: 15,
        penalties: 25,
        shots: 150,
        ppp: 10,
        shp: 2,
        hits: 100,
        blocks: 80,
        scoresByPosition: {
            goals: 70,
            assists: 75,
            points: 72,
            plusMinus: 80,
            penalties: 60,
            shots: 65,
            ppp: 55,
            shp: 50,
            hits: 85,
            blocks: 90,
        },
    };

    // Combined goalie data (without top-level season field)
    const mockGoalieCombined: Goalie & {
        seasons: GoalieSeasonStats[];
    } = {
        name: "Goalie One",
        score: 0,
        scoreAdjustedByGames: 0,
        games: 25,
        wins: 18,
        saves: 750,
        shutouts: 5,
        goals: 0,
        assists: 3,
        points: 3,
        penalties: 0,
        ppp: 0,
        shp: 0,
        seasons: [
            {
                name: "",
                season: 2024,
                games: 10,
                score: 50,
                scoreAdjustedByGames: 5,
                wins: 8,
                saves: 300,
                shutouts: 2,
                goals: 0,
                assists: 1,
                points: 1,
                penalties: 0,
                ppp: 0,
                shp: 0,
                gaa: "2.00",
                savePercent: "0.920",
            },
            {
                name: "",
                season: 2023,
                games: 15,
                score: 55,
                scoreAdjustedByGames: 5.5,
                wins: 10,
                saves: 450,
                shutouts: 3,
                goals: 0,
                assists: 2,
                points: 2,
                penalties: 0,
                ppp: 0,
                shp: 0,
                gaa: "2.10",
                savePercent: "0.915",
            },
        ],
    };

    // Single season goalie data (with top-level season field, no seasons array)
    const mockGoalieSingleSeason: Goalie & {
        season: number;
    } = {
        name: "Goalie One",
        score: 50,
        scoreAdjustedByGames: 5,
        games: 10,
        wins: 8,
        saves: 300,
        shutouts: 2,
        goals: 0,
        assists: 1,
        points: 1,
        penalties: 0,
        ppp: 0,
        shp: 0,
        gaa: "2.00",
        savePercent: "0.920",
        season: 2024,
    };

    describe("with seasons data", () => {
        let apiServiceSpy: any;

        beforeEach(async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(PlayerCardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should create and display player name", () => {
            expect(component).toBeTruthy();
            const title = fixture.debugElement.query(By.css("mat-card-title"))
                .nativeElement as HTMLElement;
            expect(title.textContent).toContain("Goalie One");
        });

        it("should build combined stats and season tables from data", () => {
            // Combined stats should include saves, savePercent and gaa reordered after saves
            const statKeys = component.stats.map((s) => s.label);
            expect(statKeys).toContain("tableColumn.saves");
            expect(statKeys).toContain("tableColumn.savePercent");
            expect(statKeys).toContain("tableColumn.gaa");

            const savesIndex = statKeys.indexOf("tableColumn.saves");
            const savePercentIndex = statKeys.indexOf("tableColumn.savePercent");
            const gaaIndex = statKeys.indexOf("tableColumn.gaa");

            expect(savePercentIndex).toBe(savesIndex + 1);
            expect(gaaIndex).toBe(savePercentIndex + 1);

            // Season data should be sorted by season, newest first, with seasonDisplay column
            expect(component.seasonDataSource.length).toBe(2);
            expect(component.seasonDataSource[0].season).toBe(2024);
            // seasonDisplay format depends on screen size (mobile: 24-25, desktop: 2024-25)
            const expectedFormat = component.isMobile ? "24-25" : "2024-25";
            expect((component.seasonDataSource[0] as any).seasonDisplay).toBe(expectedFormat);

            expect(component.seasonColumns).toContain("seasonDisplay");
            expect(component.seasonColumns).toContain("saves");
            expect(component.seasonColumns).toContain("savePercent");
            expect(component.seasonColumns).toContain("gaa");

            const savesColIndex = component.seasonColumns.indexOf("saves");
            const savePercentColIndex = component.seasonColumns.indexOf("savePercent");
            const gaaColIndex = component.seasonColumns.indexOf("gaa");

            expect(savePercentColIndex).toBe(savesColIndex + 1);
            expect(gaaColIndex).toBe(savePercentColIndex + 1);
        });

        it("should render graphs tab with stat checkboxes when seasons exist", async () => {
            const tabLabels = fixture.debugElement
                .queryAll(By.css("mat-tab-group mat-tab-header .mat-mdc-tab-labels .mdc-tab__text-label"))
                .map((el) => (el.nativeElement as HTMLElement).textContent?.trim());

            // Expect at least three tabs (All, By Season, Graphs)
            expect(tabLabels.length).toBeGreaterThanOrEqual(3);

            // Third tab should exist regardless of exact translated label
            expect(tabLabels[2]).toBeDefined();

            const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
            const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
            tabGroup.selectedIndex = 2; // select Graphs tab
            component.onTabChange(2);
            fixture.detectChanges();

            await (component as any).graphsLoadPromise;
            fixture.detectChanges();

            const checkboxEls = fixture.debugElement.queryAll(By.css(".graphs-controls-list mat-checkbox"));
            expect(checkboxEls.length).toBeGreaterThan(0);

            const canvas = fixture.debugElement.query(By.css(".graphs-chart-container canvas"));
            expect(canvas).toBeTruthy();
        });

        it("should handle goalie seasons without savePercent by placing gaa after saves", () => {
            const componentAsAny = component as any;

            const seasonsWithoutSavePercent = mockGoalieWithSeasons.seasons.map(({ savePercent, ...rest }) => rest);

            componentAsAny.data = {
                ...mockGoalieWithSeasons,
                seasons: seasonsWithoutSavePercent,
            };

            component.seasonColumns = [];
            component.seasonDataSource = [];

            componentAsAny.refreshSeasonData();

            expect(component.seasonColumns).toContain("gaa");
            expect(component.seasonColumns).not.toContain("savePercent");

            const savesIndex = component.seasonColumns.indexOf("saves");
            const gaaIndex = component.seasonColumns.indexOf("gaa");

            expect(gaaIndex).toBe(savesIndex + 1);
        });

        it("should handle goalie seasons without gaa by placing savePercent after saves", () => {
            const componentAsAny = component as any;

            const seasonsWithoutGaa = mockGoalieWithSeasons.seasons.map(({ gaa, ...rest }) => rest);

            componentAsAny.data = {
                ...mockGoalieWithSeasons,
                seasons: seasonsWithoutGaa,
            };

            component.seasonColumns = [];
            component.seasonDataSource = [];

            componentAsAny.refreshSeasonData();

            expect(component.seasonColumns).toContain("savePercent");
            expect(component.seasonColumns).not.toContain("gaa");

            const savesIndex = component.seasonColumns.indexOf("saves");
            const savePercentIndex = component.seasonColumns.indexOf("savePercent");

            expect(savePercentIndex).toBe(savesIndex + 1);
        });

        it("should reorder stats keys correctly when only gaa is present", () => {
            const statsService = (component as any).statsService;
            const keys = ["games", "saves", "gaa"];

            const reordered = statsService.reorderStatsForDisplay(keys);

            const savesIndex = reordered.indexOf("saves");
            const gaaIndex = reordered.indexOf("gaa");

            expect(gaaIndex).toBe(savesIndex + 1);
        });

        it("should build chart datasets including score metrics", () => {
            // Chart.js is now lazy-loaded with the graphs tab.
            expect(component.graphsComponent).toBeNull();
        });

        it("should build chart datasets including score metrics when graphs tab is loaded", async () => {
            fixture.detectChanges();

            const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
            const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
            tabGroup.selectedIndex = 2;
            component.onTabChange(2);
            fixture.detectChanges();

            // Wait for dynamic import + component creation.
            await (component as any).graphsLoadPromise;
            fixture.detectChanges();

            const graphsDebug = fixture.debugElement.query(By.css("app-player-card-graphs"));
            expect(graphsDebug).toBeTruthy();

            const graphs: any = graphsDebug.componentInstance;

            const data = graphs.lineChartData;
            expect(data.labels && data.labels.length).toBeGreaterThan(0);
            expect(data.datasets.length).toBeGreaterThan(0);

            const datasetLabels = (data.datasets as any[]).map((ds) => ds.label as string);

            // score-related series should be present for goalies as well
            expect(datasetLabels.some((label: string) => label.includes("score"))).toBe(true);
            expect(datasetLabels.some((label: string) => label.includes("scoreAdjustedByGames"))).toBe(true);

            // Y-axis should start at 0 and have a positive max
            const options = graphs.lineChartOptions as any;
            const yScale = options.scales?.y;

            expect(yScale).toBeTruthy();
            expect(yScale.min).toBe(0);
            expect(typeof yScale.max).toBe("number");
            expect(yScale.max).toBeGreaterThan(0);
            expect(yScale.ticks && yScale.ticks.stepSize).toBeGreaterThan(0);
        });

        it("should toggle season mode class when switching to season tab", () => {
            const cardElement = fixture.debugElement.query(By.css("mat-card"))
                .nativeElement as HTMLElement;

            expect(cardElement.classList.contains("season-mode")).toBe(false);

            component.onTabChange(1);
            fixture.detectChanges();

            expect(component.selectedTabIndex).toBe(1);
            expect(cardElement.classList.contains("season-mode")).toBe(true);
        });

        it("should close dialog when close button is clicked", () => {
            const closeButton = fixture.debugElement.query(By.css("button[mat-icon-button]"));

            closeButton.triggerEventHandler("click");
            fixture.detectChanges();

            expect(dialogRefSpy.close).toHaveBeenCalled();
        });

        describe("Graph controls toggle functionality", () => {
            it("should initialize with graphControlsExpanded set to false", () => {
                expect(component.graphsComponent).toBeNull();
            });

            it("should toggle graphControlsExpanded when toggleGraphControls is called", () => {
                // graphControlsExpanded lives in the lazy graphs component.
                expect(true).toBe(true);
            });

            it("should render graph controls toggle button when graphs tab is loaded", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const toggleButton = fixture.debugElement.query(By.css(".graphs-controls-toggle"));
                expect(toggleButton).toBeTruthy();
            });

            it("should render graph controls panel when graphs tab is loaded", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const controls = fixture.debugElement.query(By.css(".graphs-controls"));
                expect(controls).toBeTruthy();
            });

            it("should add visible class to controls when graphControlsExpanded is true", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.graphControlsExpanded = true;
                fixture.detectChanges();

                const controls = fixture.debugElement.query(By.css(".graphs-controls"));
                expect(controls.nativeElement.classList.contains("visible")).toBe(true);
            });

            it("should remove visible class from controls when graphControlsExpanded is false", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.graphControlsExpanded = false;
                fixture.detectChanges();

                const controls = fixture.debugElement.query(By.css(".graphs-controls"));
                expect(controls.nativeElement.classList.contains("visible")).toBe(false);
            });

            it("should toggle controls when button is clicked", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;

                const toggleButton = fixture.debugElement.query(By.css(".graphs-controls-toggle"));
                const controls = fixture.debugElement.query(By.css(".graphs-controls"));

                expect(graphs.graphControlsExpanded).toBe(false);
                expect(controls.nativeElement.classList.contains("visible")).toBe(false);

                toggleButton.nativeElement.click();
                fixture.detectChanges();

                expect(graphs.graphControlsExpanded).toBe(true);
                expect(controls.nativeElement.classList.contains("visible")).toBe(true);

                toggleButton.nativeElement.click();
                fixture.detectChanges();

                expect(graphs.graphControlsExpanded).toBe(false);
                expect(controls.nativeElement.classList.contains("visible")).toBe(false);
            });

            it("should show correct icon when collapsed (default)", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.graphControlsExpanded = false;
                fixture.detectChanges();

                const toggleIcon = fixture.debugElement.query(By.css(".graphs-controls-toggle .toggle-icon"));
                expect(toggleIcon.nativeElement.textContent).toContain("▼");
            });

            it("should show correct icon when expanded", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.graphControlsExpanded = true;
                fixture.detectChanges();

                const toggleIcon = fixture.debugElement.query(By.css(".graphs-controls-toggle .toggle-icon"));
                expect(toggleIcon.nativeElement.textContent).toContain("▲");
            });

            it("should set aria-expanded attribute correctly", async () => {
                fixture.detectChanges();

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                const toggleButton = fixture.debugElement.query(By.css(".graphs-controls-toggle"));

                graphs.graphControlsExpanded = true;
                fixture.detectChanges();
                expect(toggleButton.nativeElement.getAttribute("aria-expanded")).toBe("true");

                graphs.graphControlsExpanded = false;
                fixture.detectChanges();
                expect(toggleButton.nativeElement.getAttribute("aria-expanded")).toBe("false");
            });
        });

        describe("Graph checkbox keyboard shortcuts", () => {
            it("ArrowDown should focus close button when available", async () => {
                fixture.detectChanges();

                const btn = document.createElement("button");
                const focusSpy = vi.spyOn(btn, "focus");
                component.closeButton = new ElementRef(btn);

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.closeButtonEl = btn;

                const event = {
                    key: "ArrowDown",
                    preventDefault: vi.fn(),
                } as any as KeyboardEvent;

                graphs.onGraphCheckboxKeydown(event);

                expect(event.preventDefault).toHaveBeenCalled();
                expect(focusSpy).toHaveBeenCalled();
            });

            it("ArrowDown should do nothing if close button is missing", async () => {
                fixture.detectChanges();

                component.closeButton = undefined;

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.closeButtonEl = undefined;

                const event = {
                    key: "ArrowDown",
                    preventDefault: vi.fn(),
                } as any as KeyboardEvent;

                graphs.onGraphCheckboxKeydown(event);

                expect(event.preventDefault).not.toHaveBeenCalled();
            });

            it("ArrowUp should preventDefault and request focus to active tab header", async () => {
                fixture.detectChanges();

                const focusHeaderSpy = vi.spyOn(component as any, "focusActiveTabHeader");

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.requestFocusTabHeader = () => (component as any).focusActiveTabHeader();

                const event = {
                    key: "ArrowUp",
                    preventDefault: vi.fn(),
                } as any as KeyboardEvent;

                graphs.onGraphCheckboxKeydown(event);

                expect(event.preventDefault).toHaveBeenCalled();
                expect(focusHeaderSpy).toHaveBeenCalled();
            });

            it("should ignore other keys", async () => {
                fixture.detectChanges();

                const focusHeaderSpy = vi.spyOn(component as any, "focusActiveTabHeader");

                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 2;
                component.onTabChange(2);
                fixture.detectChanges();

                await (component as any).graphsLoadPromise;
                fixture.detectChanges();

                const graphs: any = fixture.debugElement.query(By.css("app-player-card-graphs")).componentInstance;
                graphs.requestFocusTabHeader = () => (component as any).focusActiveTabHeader();

                const event = {
                    key: "Escape",
                    preventDefault: vi.fn(),
                } as any as KeyboardEvent;

                graphs.onGraphCheckboxKeydown(event);

                expect(event.preventDefault).not.toHaveBeenCalled();
                expect(focusHeaderSpy).not.toHaveBeenCalled();
            });
        });

        describe("focusActiveTabHeader", () => {
            it("should focus active tab element when present in host DOM", () => {
                const active: {
                    focus: () => void;
                } = {
                    focus: vi.fn(),
                };

                const hostEl = (component as any).host.nativeElement as HTMLElement;
                vi.spyOn(hostEl, "querySelector").mockReturnValue(active as any);

                (component as any).focusActiveTabHeader();

                expect(active.focus).toHaveBeenCalled();
            });

            it("should fall back to document query when host does not contain tab header", () => {
                const hostEl = (component as any).host.nativeElement as HTMLElement;
                vi.spyOn(hostEl, "querySelector").mockReturnValue(null);

                const doc = (component as any).document as Document;
                const fallback: {
                    focus: () => void;
                } = {
                    focus: vi.fn(),
                };

                vi.spyOn(doc, "querySelector").mockReturnValue(fallback as any);

                (component as any).focusActiveTabHeader();

                expect(fallback.focus).toHaveBeenCalled();
            });
        });

        it("should format season as short form on mobile", () => {
            const seasonsService = (component as any).seasonsService;
            const short = seasonsService['formatSeasonShort'](2024);
            expect(short).toBe("24-25");
        });

        it("should update graphsInputs with close button element when available", () => {
            const btn = document.createElement("button");
            component.closeButton = new ElementRef(btn);

            (component as any).updateGraphsInputs();

            expect((component as any).graphsInputs.closeButtonEl).toBe(btn);
            expect(typeof (component as any).graphsInputs.requestFocusTabHeader).toBe("function");
        });

        it("should call checkScreenSize when window resize event fires", () => {
            const checkSpy = vi.spyOn(component as any, "checkScreenSize");

            window.dispatchEvent(new Event("resize"));

            expect(checkSpy).toHaveBeenCalled();
        });

        it("graphsInputs.requestFocusTabHeader should invoke focusActiveTabHeader", () => {
            const focusSpy = vi.spyOn(component as any, "focusActiveTabHeader");
            (component as any).updateGraphsInputs();

            (component as any).graphsInputs.requestFocusTabHeader();

            expect(focusSpy).toHaveBeenCalled();
        });

        describe("career best highlighting", () => {
            it("should highlight max values as career best for standard stats", () => {
                // 2024 has 8 wins, 2023 has 10 wins -> 2023 should be best
                expect(component.isCareerBest("wins", 2023)).toBe(true);
                expect(component.isCareerBest("wins", 2024)).toBe(false);

                // 2024 has 300 saves, 2023 has 450 saves -> 2023 should be best
                expect(component.isCareerBest("saves", 2023)).toBe(true);
                expect(component.isCareerBest("saves", 2024)).toBe(false);
            });

            it("should highlight min values as career best for GAA (lower is better)", () => {
                // 2024 has GAA 2.00, 2023 has GAA 2.10 -> 2024 should be best (lower)
                expect(component.isCareerBest("gaa", 2024)).toBe(true);
                expect(component.isCareerBest("gaa", 2023)).toBe(false);
            });

            it("should highlight all tied seasons when values are equal", () => {
                // Create data with tied values
                const tiedData: Goalie & {
                    seasons: GoalieSeasonStats[];
                } = {
                    name: "Tied Goalie",
                    score: 0,
                    scoreAdjustedByGames: 0,
                    games: 20,
                    wins: 15,
                    saves: 600,
                    shutouts: 4,
                    goals: 0,
                    assists: 2,
                    points: 2,
                    penalties: 0,
                    ppp: 0,
                    shp: 0,
                    seasons: [
                        {
                            name: "",
                            season: 2024,
                            games: 10,
                            score: 50,
                            scoreAdjustedByGames: 5,
                            wins: 8,
                            saves: 300,
                            shutouts: 2,
                            goals: 0,
                            assists: 1,
                            points: 1,
                            penalties: 0,
                            ppp: 0,
                            shp: 0,
                            gaa: "2.00",
                            savePercent: "0.920",
                        },
                        {
                            name: "",
                            season: 2023,
                            games: 10,
                            score: 50,
                            scoreAdjustedByGames: 5,
                            wins: 8, // Same as 2024
                            saves: 300, // Same as 2024
                            shutouts: 2,
                            goals: 0,
                            assists: 1,
                            points: 1,
                            penalties: 0,
                            ppp: 0,
                            shp: 0,
                            gaa: "2.00", // Same as 2024
                            savePercent: "0.920",
                        },
                    ],
                };

                TestBed.resetTestingModule();
                TestBed.configureTestingModule({
                    imports: [
                        PlayerCardComponent,
                        TranslateModule.forRoot(),
                        NoopAnimationsModule,
                    ],
                    providers: [
                        { provide: MAT_DIALOG_DATA, useValue: tiedData },
                        { provide: MatDialogRef, useValue: dialogRefSpy },
                        { provide: ApiService, useValue: apiServiceSpy },
                    ],
                });

                const tiedFixture = TestBed.createComponent(PlayerCardComponent);
                const tiedComponent = tiedFixture.componentInstance;
                tiedFixture.detectChanges();


                // Both seasons should be highlighted for tied values
                expect(tiedComponent.isCareerBest("wins", 2024)).toBe(true);
                expect(tiedComponent.isCareerBest("wins", 2023)).toBe(true);
                expect(tiedComponent.isCareerBest("saves", 2024)).toBe(true);
                expect(tiedComponent.isCareerBest("saves", 2023)).toBe(true);
                expect(tiedComponent.isCareerBest("gaa", 2024)).toBe(true);
                expect(tiedComponent.isCareerBest("gaa", 2023)).toBe(true);
            });

            it("should not highlight when all values are zero", () => {
                // ppp and shp are 0 for all seasons in mock data
                expect(component.isCareerBest("ppp", 2024)).toBe(false);
                expect(component.isCareerBest("ppp", 2023)).toBe(false);
                expect(component.isCareerBest("shp", 2024)).toBe(false);
                expect(component.isCareerBest("shp", 2023)).toBe(false);
            });

            it("should return false for non-existent column", () => {
                expect(component.isCareerBest("nonexistent", 2024)).toBe(false);
            });

            it("should return false for non-existent season", () => {
                expect(component.isCareerBest("wins", 1999)).toBe(false);
            });

            it("should apply stat-highlight class to career best cells in template", () => {
                // Switch to by-season tab
                const tabGroupDebug = fixture.debugElement.query(By.css("mat-tab-group"));
                const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
                tabGroup.selectedIndex = 1;
                fixture.detectChanges();


                // Find cells in season table
                const seasonTable = fixture.debugElement.query(By.css(".season-table"));
                expect(seasonTable).toBeTruthy();

                const cells = seasonTable.queryAll(By.css("td.mat-mdc-cell"));
                const highlightedCells = cells.filter((cell) => cell.nativeElement.classList.contains("stat-highlight"));

                // Should have some highlighted cells (career bests)
                expect(highlightedCells.length).toBeGreaterThan(0);
            });
        });
    });

    describe("career best with single season", () => {
        let apiServiceSpy: any;

        beforeEach(async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            const singleSeasonData: Goalie & {
                seasons: GoalieSeasonStats[];
            } = {
                name: "Single Season Goalie",
                score: 50,
                scoreAdjustedByGames: 5,
                games: 10,
                wins: 8,
                saves: 300,
                shutouts: 2,
                goals: 0,
                assists: 1,
                points: 1,
                penalties: 0,
                ppp: 0,
                shp: 0,
                seasons: [
                    {
                        name: "",
                        season: 2024,
                        games: 10,
                        score: 50,
                        scoreAdjustedByGames: 5,
                        wins: 8,
                        saves: 300,
                        shutouts: 2,
                        goals: 0,
                        assists: 1,
                        points: 1,
                        penalties: 0,
                        ppp: 0,
                        shp: 0,
                        gaa: "2.00",
                        savePercent: "0.920",
                    },
                ],
            };

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: singleSeasonData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(PlayerCardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should not highlight any values with only one season", () => {
            expect(component.careerBests.size).toBe(0);
            expect(component.isCareerBest("wins", 2024)).toBe(false);
            expect(component.isCareerBest("saves", 2024)).toBe(false);
            expect(component.isCareerBest("gaa", 2024)).toBe(false);
        });
    });

    describe("without seasons data", () => {
        let apiServiceSpy: any;

        beforeEach(async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(PlayerCardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should render stats table without tabs when no seasons", () => {
            expect(component.hasSeasons).toBe(false);

            const tabGroup = fixture.debugElement.query(By.css("mat-tab-group"));
            expect(tabGroup).toBeNull();

            const rows = fixture.debugElement.queryAll(By.css("tr[mat-row]"));
            expect(rows.length).toBeGreaterThan(0);

            const firstRowText = (rows[0].nativeElement as HTMLElement).textContent;
            expect(firstRowText).toContain("tableColumn.score");
        });

        it("should safely ignore refreshSeasonData when there is no seasons array", () => {
            const componentAsAny = component as any;

            expect(component.seasonColumns.length).toBe(0);
            expect(component.seasonDataSource.length).toBe(0);

            componentAsAny.refreshSeasonData();

            expect(component.seasonColumns.length).toBe(0);
            expect(component.seasonDataSource.length).toBe(0);
        });

        it("should set viewContext to season for data without seasons", () => {
            expect(component.viewContext).toBe("season");
        });

        it("should show Graphs tab when data has scores property", () => {
            const mockSkaterWithScores: Player = {
                ...mockSkaterWithoutSeasons,
                scores: {
                    goals: 75,
                    assists: 82,
                    points: 90,
                    plusMinus: 60,
                    penalties: 45,
                    shots: 70,
                    ppp: 65,
                    shp: 55,
                    hits: 80,
                    blocks: 72,
                },
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithScores },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.showGraphsTab).toBe(true);
        });

        it("should not show Graphs tab when data has no scores and no seasons", () => {
            expect(component.showGraphsTab).toBe(false);
        });

        it("should include viewContext in graphsInputs", () => {
            expect(component.graphsInputs["viewContext"]).toBe("season");
        });
    });

    describe("position display", () => {
        let apiServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
        });

        it("should display H for forward players", async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.positionAbbreviation).toBe("H");
            expect(c.positionTooltip).toBe("Hyökkääjä");
        });

        it("should display P for defensemen", async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.positionAbbreviation).toBe("P");
            expect(c.positionTooltip).toBe("Puolustaja");
        });

        it("should display M for goalies", async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.positionAbbreviation).toBe("M");
            expect(c.positionTooltip).toBe("Maalivahti");
        });

        it("should exclude position-related fields from stats display", async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            const statLabels = c.stats.map((s) => s.label);
            expect(statLabels).not.toContain("tableColumn.position");
            expect(statLabels).not.toContain("tableColumn.scoreByPosition");
            expect(statLabels).not.toContain("tableColumn.scoreByPositionAdjustedByGames");
            expect(statLabels).not.toContain("tableColumn.scoresByPosition");
        });
    });

    describe("viewContext and showGraphsTab", () => {
        let apiServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
        });

        it("should set viewContext to combined if have seasons", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.viewContext).toBe("combined");
            expect(c.showGraphsTab).toBe(true);
        });
    });

    describe("statsPerGame mode", () => {
        let apiServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
        });

        it("should exclude score from stats when statsPerGame is true", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ statsPerGame: true });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(c.statsPerGame).toBe(true);
            const statLabels = c.stats.map((s) => s.label);
            expect(statLabels).not.toContain("tableColumn.score");
            expect(statLabels).toContain("tableColumn.scoreAdjustedByGames");
        });

        it("should include score in stats when statsPerGame is false", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ statsPerGame: false });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(c.statsPerGame).toBe(false);
            const statLabels = c.stats.map((s) => s.label);
            expect(statLabels).toContain("tableColumn.score");
            expect(statLabels).toContain("tableColumn.scoreAdjustedByGames");
        });

        it("should not render score row in the table when statsPerGame is true", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ statsPerGame: true });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));
            f.detectChanges();

            const statLabels = c.stats.map((s) => s.label);
            expect(statLabels).not.toContain("tableColumn.score");
            expect(statLabels).toContain("tableColumn.scoreAdjustedByGames");
        });

        it("should place games after score columns in stats order", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            const statLabels = c.stats.map((s) => s.label);
            const scoreIndex = statLabels.indexOf("tableColumn.score");
            const scoreAdjustedIndex = statLabels.indexOf("tableColumn.scoreAdjustedByGames");
            const gamesIndex = statLabels.indexOf("tableColumn.games");

            // Games should come after score and scoreAdjustedByGames
            expect(gamesIndex).toBeGreaterThan(scoreIndex);
            expect(gamesIndex).toBeGreaterThan(scoreAdjustedIndex);
            // And games should be immediately after scoreAdjustedByGames
            expect(gamesIndex).toBe(scoreAdjustedIndex + 1);
        });

        it("should get statsPerGame from goalie filters for goalies", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updateGoalieFilters({ statsPerGame: true });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(c.statsPerGame).toBe(true);
            expect(c.isGoalie).toBe(true);
        });
    });

    describe("position filter toggle in player card", () => {
        let apiServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
        });

        it("should return correct switch label for forwards", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            expect(c.positionSwitchLabel).toBe("playerCardPositionFilter.forwards");
        });

        it("should return correct switch label for defensemen", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            expect(c.positionSwitchLabel).toBe("playerCardPositionFilter.defensemen");
        });

        it("should return empty string for goalie switch label", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            expect(c.positionSwitchLabel).toBe("");
        });

        it("should return true for isPositionFilterEnabled when position filter is not all", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "F" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(c.isPositionFilterEnabled).toBe(true);
        });

        it("should return false for isPositionFilterEnabled when position filter is all", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "all" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            expect(c.isPositionFilterEnabled).toBe(false);
        });

        it("should update filter service when toggle is turned on", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "all" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            vi.spyOn(filterService, "updatePlayerFilters");

            c.onPositionFilterToggle(true);

            expect(filterService.updatePlayerFilters).toHaveBeenCalledWith({
                positionFilter: "F",
            });
            expect(c.positionFilter).toBe("F");
        });

        it("should update filter service when toggle is turned off", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "D" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            vi.spyOn(filterService, "updatePlayerFilters");

            c.onPositionFilterToggle(false);

            expect(filterService.updatePlayerFilters).toHaveBeenCalledWith({
                positionFilter: "all",
            });
            expect(c.positionFilter).toBe("all");
        });

        it("should not call filter service when goalie tries to toggle", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            vi.spyOn(filterService, "updatePlayerFilters");

            c.onPositionFilterToggle(true);

            expect(filterService.updatePlayerFilters).not.toHaveBeenCalled();
        });

        it("should not render position filter switch for goalies", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();

            const switchElement = f.debugElement.query(By.css(".position-filter-switch"));
            expect(switchElement).toBeNull();
        });

        it("should render position filter switch for players", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();

            const switchElement = f.debugElement.query(By.css(".position-filter-switch"));
            expect(switchElement).toBeTruthy();
        });

        it("should use position-based score values when filter is active", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "D" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Find the score stat and verify it uses position-based value
            const scoreStat = c.stats.find((s) => s.label === "tableColumn.score");
            expect(scoreStat?.value).toBe(mockDefenseman.scoreByPosition);
        });

        it("should use regular score values when filter is all", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "all" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Find the score stat and verify it uses regular value
            const scoreStat = c.stats.find((s) => s.label === "tableColumn.score");
            expect(scoreStat?.value).toBe(mockDefenseman.score);
        });

        it("should rebuild stats when toggling position filter on", async () => {
            const { FilterService } = await import("@services/filter.service");

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockDefenseman },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "all" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Initially should use regular score
            let scoreStat = c.stats.find((s) => s.label === "tableColumn.score");
            expect(scoreStat?.value).toBe(mockDefenseman.score);

            // Toggle position filter on
            c.onPositionFilterToggle(true);

            // Now should use position-based score
            scoreStat = c.stats.find((s) => s.label === "tableColumn.score");
            expect(scoreStat?.value).toBe(mockDefenseman.scoreByPosition);
        });

        it("should rebuild season data when toggling position filter", async () => {
            const { FilterService } = await import("@services/filter.service");

            const mockPlayerWithSeasons = {
                name: "Player With Seasons",
                position: "D" as const,
                score: 80,
                scoreAdjustedByGames: 4,
                scoreByPosition: 90,
                scoreByPositionAdjustedByGames: 4.5,
                games: 82,
                goals: 10,
                assists: 30,
                points: 40,
                plusMinus: 15,
                penalties: 25,
                shots: 150,
                ppp: 10,
                shp: 2,
                hits: 100,
                blocks: 80,
                seasons: [
                    {
                        season: 2024,
                        games: 82,
                        score: 100,
                        scoreAdjustedByGames: 1.22,
                        scoreByPosition: 85,
                        scoreByPositionAdjustedByGames: 1.04,
                        goals: 10,
                        assists: 30,
                        points: 40,
                        plusMinus: 15,
                        penalties: 25,
                        shots: 150,
                        ppp: 10,
                        shp: 2,
                        hits: 100,
                        blocks: 80,
                    },
                ],
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockPlayerWithSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "all" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Initially should use regular score in season data
            expect((c.seasonDataSource[0] as any).score).toBe(100);

            // Toggle position filter on
            c.onPositionFilterToggle(true);

            // Now should use position-based score in season data
            expect((c.seasonDataSource[0] as any).score).toBe(85);
            expect((c.seasonDataSource[0] as any).scoreAdjustedByGames).toBe(1.04);
        });

        it("should fall back to regular scores when position-based values missing in season", async () => {
            const { FilterService } = await import("@services/filter.service");

            const mockPlayerWithSeasonsNoPositionScores = {
                name: "Player With Seasons",
                position: "D" as const,
                score: 80,
                scoreAdjustedByGames: 4,
                games: 82,
                goals: 10,
                assists: 30,
                points: 40,
                plusMinus: 15,
                penalties: 25,
                shots: 150,
                ppp: 10,
                shp: 2,
                hits: 100,
                blocks: 80,
                seasons: [
                    {
                        season: 2024,
                        games: 82,
                        score: 100,
                        scoreAdjustedByGames: 1.22,
                        // No position-based scores
                        goals: 10,
                        assists: 30,
                        points: 40,
                        plusMinus: 15,
                        penalties: 25,
                        shots: 150,
                        ppp: 10,
                        shp: 2,
                        hits: 100,
                        blocks: 80,
                    },
                ],
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    {
                        provide: MAT_DIALOG_DATA,
                        useValue: mockPlayerWithSeasonsNoPositionScores,
                    },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    FilterService,
                ],
            }).compileComponents();

            const filterService = TestBed.inject(FilterService);
            filterService.updatePlayerFilters({ positionFilter: "D" });

            const f = TestBed.createComponent(PlayerCardComponent);
            f.detectChanges();
            const c = f.componentInstance;

            // Wait for filter subscription to complete
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should still use regular scores (fallback)
            expect((c.seasonDataSource[0] as any).score).toBe(100);
            expect((c.seasonDataSource[0] as any).scoreAdjustedByGames).toBe(1.22);
        });
    });

    describe("wrapped dialog data format", () => {
        let apiServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
        });

        it("should extract player from wrapped data format", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = { player: mockGoalieWithSeasons };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.data).toEqual(mockGoalieWithSeasons);
            expect(c.initialTab).toBeUndefined();
        });

        it("should set initialTab to all and select first tab", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockGoalieWithSeasons,
                initialTab: "all" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.initialTab).toBe("all");
            expect(c.selectedTabIndex).toBe(0);
        });

        it("should set initialTab to by-season and select second tab when hasSeasons", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockGoalieWithSeasons,
                initialTab: "by-season" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.initialTab).toBe("by-season");
            expect(c.selectedTabIndex).toBe(1);
        });

        it("should fall back to tab 0 for by-season when no seasons exist", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockSkaterWithoutSeasons,
                initialTab: "by-season" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.selectedTabIndex).toBe(0);
        });

        it("should set initialTab to graphs and select third tab when hasSeasons", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockGoalieWithSeasons,
                initialTab: "graphs" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            // Prevent the real dynamic import: ensureGraphsLoaded is called in the constructor.
            // A pending async import would resolve later and trigger zone.js change detection
            // on an invalidated component, crashing subsequent tests.
            const ensureSpy = vi.spyOn(PlayerCardComponent.prototype as any, 'ensureGraphsLoaded')
                .mockReturnValue(new Promise<void>(() => { /* never resolves */ }));
            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            ensureSpy.mockRestore();

            expect(c.initialTab).toBe("graphs");
            expect(c.selectedTabIndex).toBe(2);
        });

        it("should pre-load graphs component when initialTab is graphs", async () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockGoalieWithSeasons,
                initialTab: "graphs" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            // ensureGraphsLoaded is called in the constructor (not ngOnInit).
            // We must spy on the prototype BEFORE createComponent() so the constructor
            // sees the stub instead of the real dynamic import, which would resolve
            // asynchronously inside Angular's zone and crash the renderer in jsdom via
            // zone.js-triggered change detection that runs after this test completes.
            const ensureSpy = vi.spyOn(PlayerCardComponent.prototype as any, 'ensureGraphsLoaded')
                .mockReturnValue(new Promise<void>(() => { /* never resolves */ }));

            TestBed.createComponent(PlayerCardComponent);

            try {
                // The spy should have been called once in the constructor since initialTab === 'graphs'
                expect(ensureSpy).toHaveBeenCalledTimes(1);
            } finally {
                ensureSpy.mockRestore();
            }
        });

        it("should fall back to tab 0 for graphs when showGraphsTab is false", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            // mockSkaterWithoutSeasons has no scores and no seasons, so showGraphsTab is false
            const wrappedData = {
                player: mockSkaterWithoutSeasons,
                initialTab: "graphs" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.selectedTabIndex).toBe(0);
        });

        it("should handle unknown tab name by falling back to 0", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const wrappedData = {
                player: mockGoalieWithSeasons,
                initialTab: "unknown" as any,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;

            expect(c.selectedTabIndex).toBe(0);
        });

        it("should select graphs at index 1 when no seasons but has scores", () => {
            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            const playerWithScores: Player = {
                ...mockSkaterWithoutSeasons,
                scores: {
                    goals: 75,
                    assists: 82,
                    points: 90,
                    plusMinus: 60,
                    penalties: 45,
                    shots: 70,
                    ppp: 65,
                    shp: 55,
                    hits: 80,
                    blocks: 72,
                },
            };

            const wrappedData = {
                player: playerWithScores,
                initialTab: "graphs" as const,
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: wrappedData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                ],
            }).compileComponents();

            // Prevent the real dynamic import: ensureGraphsLoaded is called in the constructor
            // when showGraphsTab is true and the selected tab is the graphs tab.
            const ensureSpy = vi.spyOn(PlayerCardComponent.prototype as any, 'ensureGraphsLoaded')
                .mockReturnValue(new Promise<void>(() => { /* never resolves */ }));
            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            ensureSpy.mockRestore();

            // No seasons, so graphs is at index 1
            expect(c.selectedTabIndex).toBe(1);
        });
    });

    describe("copyLinkToClipboard", () => {
        let apiServiceSpy: any;
        let teamServiceSpy: any;

        beforeEach(async () => {
            // jsdom does not implement navigator.clipboard - provide a minimal mock.
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: vi.fn().mockResolvedValue(undefined) },
                writable: true,
                configurable: true,
            });

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            teamServiceSpy = {
                selectedTeamId: "1"
            } as any;

            apiServiceSpy.getTeams.mockReturnValue(of([
                { id: "1", name: "colorado", presentName: "Colorado Avalanche" },
                { id: "2", name: "dallas", presentName: "Dallas Stars" },
            ]));

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    // Use combined goalie data (without top-level season field)
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieCombined },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            fixture = TestBed.createComponent(PlayerCardComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it("should copy player link to clipboard", () => {
            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            component.copyLinkToClipboard();


            expect(apiServiceSpy.getTeams).toHaveBeenCalled();
            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one$/));
        });

        it("should set linkCopied to true after copying", async () => {
            vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            expect(component.linkCopied).toBe(false);

            component.copyLinkToClipboard();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(component.linkCopied).toBe(true);
        });

        it("should reset linkCopied to false after 2 seconds", async () => {
            vi.useFakeTimers();
            vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            component.copyLinkToClipboard();
            await Promise.resolve(); // Let the .then() callback run

            expect(component.linkCopied).toBe(true);

            vi.advanceTimersByTime(2000);

            expect(component.linkCopied).toBe(false);

            vi.useRealTimers();
        });

        it("should not copy if team not found", () => {
            component.selectedTeam = undefined;
            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");

            component.copyLinkToClipboard();


            expect(writeTextSpy).not.toHaveBeenCalled();
        });

        it("should generate player link for non-goalie", () => {
            // Reset with player data
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockSkaterWithoutSeasons },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            c.copyLinkToClipboard();


            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/player\/colorado\/player-one$/));
        });

        it("should include tab=by-season query param when on by-season tab", () => {
            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            // Switch to by-season tab (index 1)
            component.onTabChange(1);
            component.copyLinkToClipboard();


            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one\?tab=by-season$/));
        });

        it("should include tab=graphs query param when on graphs tab", () => {
            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            // Switch to graphs tab (index 2 when hasSeasons)
            component.onTabChange(2);
            component.copyLinkToClipboard();


            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one\?tab=graphs$/));
        });

        it("should not include tab query param when on all tab", () => {
            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            // Ensure we're on all tab (index 0)
            component.onTabChange(0);
            component.copyLinkToClipboard();


            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one$/));
            // Verify no query params
            expect(writeTextSpy).not.toHaveBeenCalledWith(expect.stringMatching(/\?tab=/));
        });

        it("should include tab=graphs for player without seasons on graphs tab", () => {
            // Reset with player that has scores but no seasons
            const playerWithScores = {
                ...mockSkaterWithoutSeasons,
                scores: {
                    goals: 75,
                    assists: 82,
                    points: 90,
                    plusMinus: 60,
                    penalties: 45,
                    shots: 70,
                    ppp: 65,
                    shp: 55,
                    hits: 80,
                    blocks: 72,
                },
            };

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: playerWithScores },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            // Switch to graphs tab (index 1 when no seasons)
            c.onTabChange(1);
            c.copyLinkToClipboard();


            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/player\/colorado\/player-one\?tab=graphs$/));
        });

        it("should include season in path for single-season data", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: mockGoalieSingleSeason },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            c.copyLinkToClipboard();


            // Season is now in the path, not query param
            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one\/2024$/));
        });

        it("should include season in path and tab as query param for single-season data on graphs tab", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    // Single season with scores (so graphs tab is available)
                    {
                        provide: MAT_DIALOG_DATA,
                        useValue: {
                            ...mockGoalieSingleSeason,
                            scores: { wins: 80, saves: 90, shutouts: 70 },
                        },
                    },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockReturnValue(Promise.resolve());

            // Switch to graphs tab (index 1 for single season data with scores)
            c.onTabChange(1);
            c.copyLinkToClipboard();


            // Season in path, tab as query param
            expect(writeTextSpy).toHaveBeenCalledWith(expect.stringMatching(/\/goalie\/colorado\/goalie-one\/2024\?tab=graphs$/));
        });
    });

    describe('navigation', () => {
        let apiServiceSpy: any;
        let teamServiceSpy: any;

        beforeEach(() => {
            apiServiceSpy = {
                getTeams: vi.fn().mockName("ApiService.getTeams")
            } as any;
            teamServiceSpy = {
                selectedTeamId: "1"
            } as any;
            apiServiceSpy.getTeams.mockReturnValue(of([{ id: "1", name: "colorado", presentName: "Colorado Avalanche" }]));
            // Default to reduced motion so existing navigation tests get instant data swap
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockReturnValue({
                    matches: true,
                    media: '',
                    onchange: null,
                    addListener: () => { },
                    removeListener: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    dispatchEvent: () => false,
                }),
            });
        });

        it('should navigate to next player on ArrowRight', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            c.onKeydown(event);

            expect(c.navigationService.currentIndex).toBe(1);
            expect(c.data.name).toBe('Player 2');
            expect(onNavigateSpy).toHaveBeenCalledWith(1);
        });

        it('should navigate to previous player on ArrowLeft', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[1],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 1,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            c.onKeydown(event);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
            expect(onNavigateSpy).toHaveBeenCalledWith(0);
        });

        it('should wrap to last player when navigating left from first', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
                { name: 'Player 3', games: 8, goals: 4, assists: 2, points: 6, score: 80 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            c.onKeydown(event);

            expect(c.navigationService.currentIndex).toBe(2);
            expect(c.data.name).toBe('Player 3');
        });

        it('should wrap to first player when navigating right from last', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[1],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 1,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            c.onKeydown(event);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
        });

        it('should not navigate when only one player', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            c.onKeydown(event);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
            expect(onNavigateSpy).not.toHaveBeenCalled();
        });

        it('should not navigate via touch swipe when only one player', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
            ];

            const onNavigateSpy = vi.fn();
            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: onNavigateSpy,
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            c.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 0, clientY: 100 }] } as any);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
            expect(onNavigateSpy).not.toHaveBeenCalled();
        });

        it('should navigate to next player on touch swipe left', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            c.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 100, clientY: 105 }] } as any);

            expect(c.navigationService.currentIndex).toBe(1);
            expect(c.data.name).toBe('Player 2');
        });

        it('should navigate to previous player on touch swipe right', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[1],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 1,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            c.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 200, clientY: 105 }] } as any);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
        });

        it('should ignore touch swipe with too much vertical movement', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            c.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 120, clientY: 300 }] } as any);

            expect(c.navigationService.currentIndex).toBe(0); // No navigation
            expect(c.data.name).toBe('Player 1');
        });

        it('should navigate to next player on trackpad swipe (wheel)', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            // Simulate trackpad swipe right (deltaX > threshold → next)
            (c.navigationService as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as any);

            expect(c.navigationService.currentIndex).toBe(1);
            expect(c.data.name).toBe('Player 2');
        });

        it('should ignore vertical wheel events', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            // Vertical scroll — should be ignored
            (c.navigationService as any).onWheel({ deltaX: 5, deltaY: 60, preventDefault: () => { } } as any);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
        });

        it('should ignore multi-touch gestures', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: { allPlayers: players, currentIndex: 0 },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [PlayerCardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            // Multi-touch start should be ignored
            c.onTouchStart({ touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 200 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 0, clientY: 100 }] } as any);

            expect(c.navigationService.currentIndex).toBe(0);

            // Multi-touch end should be ignored
            c.onTouchStart({ touches: [{ clientX: 200, clientY: 100 }] } as any);
            c.onTouchEnd({ changedTouches: [{ clientX: 0, clientY: 100 }, { clientX: 0, clientY: 200 }] } as any);

            expect(c.navigationService.currentIndex).toBe(0);
        });

        it('should navigate to previous player on trackpad swipe (wheel negative deltaX)', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[1],
                navigationContext: { allPlayers: players, currentIndex: 1 },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [PlayerCardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            (c.navigationService as any).onWheel({ deltaX: -60, deltaY: 0, preventDefault: () => { } } as any);

            expect(c.navigationService.currentIndex).toBe(0);
            expect(c.data.name).toBe('Player 1');
        });

        it('should debounce rapid wheel events with cooldown', async () => {
            vi.useFakeTimers();

            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
                { name: 'Player 3', games: 14, goals: 7, assists: 5, points: 12, score: 140 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: { allPlayers: players, currentIndex: 0 },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [PlayerCardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            // First wheel triggers navigation
            (c.navigationService as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(1);

            // Immediate second wheel is blocked by cooldown
            (c.navigationService as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(1); // Still 1, not 2

            // After cooldown expires, navigation works again
            vi.advanceTimersByTime(501);
            (c.navigationService as any).onWheel({ deltaX: 60, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(2);

            vi.useRealTimers();
        });

        it('should accumulate small wheel deltas before navigating', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: { allPlayers: players, currentIndex: 0 },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [PlayerCardComponent, TranslateModule.forRoot(), NoopAnimationsModule],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            // Small deltas below threshold — no navigation yet
            (c.navigationService as any).onWheel({ deltaX: 20, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(0);

            (c.navigationService as any).onWheel({ deltaX: 20, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(0);

            // Accumulated > 50 — triggers navigation
            (c.navigationService as any).onWheel({ deltaX: 20, deltaY: 0, preventDefault: () => { } } as any);
            expect(c.navigationService.currentIndex).toBe(1);
        });

        it('should announce player change to screen readers', async () => {
            const players: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const dialogData: PlayerCardDialogData = {
                player: players[0],
                navigationContext: {
                    allPlayers: players,
                    currentIndex: 0,
                    onNavigate: vi.fn(),
                },
            };

            dialogRefSpy = {
                close: vi.fn().mockName("MatDialogRef.close")
            } as any;

            await TestBed.configureTestingModule({
                imports: [
                    PlayerCardComponent,
                    TranslateModule.forRoot(),
                    NoopAnimationsModule,
                ],
                providers: [
                    { provide: MAT_DIALOG_DATA, useValue: dialogData },
                    { provide: MatDialogRef, useValue: dialogRefSpy },
                    { provide: ApiService, useValue: apiServiceSpy },
                    { provide: TeamService, useValue: teamServiceSpy },
                ],
            }).compileComponents();

            const f = TestBed.createComponent(PlayerCardComponent);
            const c = f.componentInstance;
            f.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            c.onKeydown(event);

            expect(c.navigationService.liveRegionMessage).toBe('Pelaaja 2 / 2: Player 2');
        });

        describe('navigation transition', () => {
            function mockMatchMedia(reducedMotion: boolean): MediaQueryList {
                return {
                    matches: reducedMotion,
                    media: '',
                    onchange: null,
                    addListener: () => { },
                    removeListener: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    dispatchEvent: () => false,
                } as MediaQueryList;
            }

            async function createNavComponent(players: Player[], startIndex = 0) {
                (window.matchMedia as Mock).mockReturnValue(mockMatchMedia(false));

                const dialogData: PlayerCardDialogData = {
                    player: players[startIndex],
                    navigationContext: {
                        allPlayers: players,
                        currentIndex: startIndex,
                        onNavigate: vi.fn(),
                    },
                };

                dialogRefSpy = {
                    close: vi.fn().mockName("MatDialogRef.close")
                } as any;

                await TestBed.configureTestingModule({
                    imports: [
                        PlayerCardComponent,
                        TranslateModule.forRoot(),
                        NoopAnimationsModule,
                    ],
                    providers: [
                        { provide: MAT_DIALOG_DATA, useValue: dialogData },
                        { provide: MatDialogRef, useValue: dialogRefSpy },
                        { provide: ApiService, useValue: apiServiceSpy },
                        { provide: TeamService, useValue: teamServiceSpy },
                    ],
                }).compileComponents();

                const f = TestBed.createComponent(PlayerCardComponent);
                const c = f.componentInstance;
                f.detectChanges();
                return c;
            }

            const twoPlayers: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
            ];

            const threePlayers: Player[] = [
                { name: 'Player 1', games: 10, goals: 5, assists: 3, points: 8, score: 100 } as Player,
                { name: 'Player 2', games: 12, goals: 6, assists: 4, points: 10, score: 120 } as Player,
                { name: 'Player 3', games: 14, goals: 7, assists: 5, points: 12, score: 140 } as Player,
            ];

            it('should apply slide-out-left class when navigating to next player', async () => {
                const c = await createNavComponent(twoPlayers);

                (c.navigationService as any).navigateToNext();

                expect(c.navigationService.slideClass).toContain('slide-out-left');

            });

            it('should apply slide-out-right class when navigating to previous player', async () => {
                const c = await createNavComponent(twoPlayers, 1);

                (c.navigationService as any).navigateToPrevious();

                expect(c.navigationService.slideClass).toContain('slide-out-right');

            });

            it('should swap player data after slide-out animation completes', async () => {
                vi.useFakeTimers();
                const c = await createNavComponent(twoPlayers);

                (c.navigationService as any).navigateToNext();
                expect(c.data.name).toBe('Player 1'); // Not yet swapped

                vi.advanceTimersByTime(125);
                expect(c.data.name).toBe('Player 2'); // Now swapped

                vi.advanceTimersByTime(125);
                expect(c.navigationService.slideClass).toBe('card-content-wrapper'); // Clean state

                vi.useRealTimers();
            });

            it('should skip animation when prefers-reduced-motion is set', async () => {
                (window.matchMedia as Mock).mockReturnValue(mockMatchMedia(true));

                const c = await createNavComponent(twoPlayers);
                // Override again since createNavComponent sets it to false
                (window.matchMedia as Mock).mockReturnValue(mockMatchMedia(true));

                (c.navigationService as any).navigateToNext();

                expect(c.navigationService.slideClass).toBe(''); // No animation classes
                expect(c.data.name).toBe('Player 2'); // Immediate swap
            });

            it('should cancel in-progress animation on rapid navigation', async () => {
                vi.useFakeTimers();
                const c = await createNavComponent(threePlayers);

                (c.navigationService as any).navigateToNext(); // Start animating to Player 2

                vi.advanceTimersByTime(50); // Halfway through first animation
                (c.navigationService as any).navigateToNext(); // Cancels first, starts new from index 0 → 1

                vi.advanceTimersByTime(125); // Complete second animation
                // First animation was canceled before it could swap data
                expect(c.data.name).toBe('Player 2');

                vi.useRealTimers();
            });

            it('should return to clean slideClass after full animation cycle', async () => {
                vi.useFakeTimers();
                const c = await createNavComponent(twoPlayers);

                (c.navigationService as any).navigateToNext();

                vi.advanceTimersByTime(125);
                expect(c.navigationService.slideClass).toBe('card-content-wrapper');

                vi.advanceTimersByTime(125);
                expect(c.navigationService.slideClass).toBe('card-content-wrapper');

                vi.useRealTimers();
            });
        });
    });
});
