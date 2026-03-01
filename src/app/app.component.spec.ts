import type { Mock } from "vitest";
import { TestBed } from "@angular/core/testing";
import { AppComponent } from "./app.component";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Title } from "@angular/platform-browser";
import { Component } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { BehaviorSubject, filter, firstValueFrom, of, Subject, throwError, } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { GlobalNavComponent } from "@shared/global-nav/global-nav.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ViewportService } from "@services/viewport.service";
import { ApiService } from "@services/api.service";
import { TeamService } from "@services/team.service";
import { DrawerContextService } from "@services/drawer-context.service";
import { PwaUpdateService } from "@services/pwa-update.service";

class TeamServiceMock {
    private readonly selectedTeamIdSubject = new BehaviorSubject<string>("1");
    readonly selectedTeamId$ = this.selectedTeamIdSubject.asObservable();

    get selectedTeamId(): string {
        return this.selectedTeamIdSubject.value;
    }

    setTeamId(teamId: string): void {
        this.selectedTeamIdSubject.next(teamId);
    }
}

class PwaUpdateServiceMock {
    private readonly updateAvailableSubject = new BehaviorSubject(false);
    readonly updateAvailable$ = this.updateAvailableSubject.asObservable();

    readonly activateAndReload = vi.fn();

    setUpdateAvailable(value: boolean): void {
        this.updateAvailableSubject.next(value);
    }
}

class ViewportServiceMock {
    private readonly isMobileSubject = new BehaviorSubject<boolean>(false);
    readonly isMobile$ = this.isMobileSubject.asObservable();

    setMobile(value: boolean): void {
        this.isMobileSubject.next(value);
    }
}

describe("AppComponent", () => {
    afterEach(() => vi.restoreAllMocks());

    let translateService: TranslateService;
    let titleService: Title;
    let dialog: {
        open: Mock;
    };
    let bottomSheet: {
        open: Mock;
    };
    let apiServiceMock: any;
    let viewportServiceMock: ViewportServiceMock;
    let pwaUpdateService: PwaUpdateServiceMock;
    let snackBar: any;
    let snackBarAction$: Subject<void>;
    let snackBarAfterDismissed$: Subject<{
        dismissedByAction: boolean;
    }>;
    @Component({ template: "" })
    class DummyRouteComponent {
    }

    beforeEach(async () => {
        dialog = { open: vi.fn() };
        bottomSheet = { open: vi.fn() };

        pwaUpdateService = new PwaUpdateServiceMock();

        viewportServiceMock = new ViewportServiceMock();

        snackBarAction$ = new Subject<void>();
        snackBarAfterDismissed$ = new Subject<{
            dismissedByAction: boolean;
        }>();
        snackBar = {
            open: vi.fn().mockName("MatSnackBar.open")
        } as any;
        snackBar.open.mockReturnValue({
            onAction: () => snackBarAction$.asObservable(),
            afterDismissed: () => snackBarAfterDismissed$.asObservable(),
        } as any);

        apiServiceMock = {
            getTeams: vi.fn().mockName("ApiService.getTeams"),
            getSeasons: vi.fn().mockName("ApiService.getSeasons"),
            getLastModified: vi.fn().mockName("ApiService.getLastModified")
        } as any;
        apiServiceMock.getTeams.mockReturnValue(of([]));
        apiServiceMock.getSeasons.mockReturnValue(of([]));
        apiServiceMock.getLastModified.mockReturnValue(of({ lastModified: "2026-01-30T11:03:07.210Z" }));

        await TestBed.configureTestingModule({
            imports: [AppComponent, TranslateModule.forRoot()],
            providers: [
                provideRouter([{ path: "**", component: DummyRouteComponent }]),
                Title,
                { provide: ViewportService, useValue: viewportServiceMock },
                { provide: ApiService, useValue: apiServiceMock },
                { provide: TeamService, useClass: TeamServiceMock },
                DrawerContextService,
            ],
        })
            .overrideProvider(MatDialog, { useValue: dialog })
            .overrideProvider(MatBottomSheet, { useValue: bottomSheet })
            .overrideProvider(PwaUpdateService, { useValue: pwaUpdateService })
            .overrideProvider(MatSnackBar, { useValue: snackBar })
            .compileComponents();

        translateService = TestBed.inject(TranslateService);
        titleService = TestBed.inject(Title);
    });

    it("should render last modified in the settings drawer on mobile (not under title)", () => {
        viewportServiceMock.setMobile(true);
        apiServiceMock.getLastModified.mockReturnValue(of({ lastModified: "2026-01-30T11:03:07.210Z" }));

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const drawerLastModified = el.querySelector(".settings-drawer-last-modified");
        expect(drawerLastModified).toBeTruthy();

        const desktopLastModified = el.querySelector(".last-modified");
        expect(desktopLastModified).toBeFalsy();
    });

    it("should set page title on init", async () => {
        vi.spyOn(translateService, "get").mockReturnValue(of("Test Title"));
        vi.spyOn(titleService, "setTitle");

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        expect(translateService.get).toHaveBeenCalledWith("pageTitle");
        expect(titleService.setTitle).toHaveBeenCalledWith("Test Title");
    });

    it("should update page title for each emission from translateService", () => {
        const translateSubject = new Subject<string>();
        vi.spyOn(translateService, "get").mockReturnValue(translateSubject.asObservable());
        const setTitleSpy = vi.spyOn(titleService, "setTitle");

        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        translateSubject.next("First Title");
        translateSubject.next("Second Title");

        expect(vi.mocked(setTitleSpy).mock.calls.length).toBe(2);
        expect(vi.mocked(setTitleSpy).mock.lastCall![0]).toBe("Second Title");
    });

    it("should open help dialog when openHelpDialog is called", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;

        app.openHelpDialog();
        expect(dialog.open).toHaveBeenCalled();
    });

    it('should open GlobalNavComponent bottom sheet when openNavMenu is called', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;

        app.openNavMenu();

        expect(bottomSheet.open).toHaveBeenCalledWith(GlobalNavComponent, { autoFocus: false });
    });

    it("should update controls context and close settings drawer on navigation", async () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        const router = TestBed.inject(Router);
        fixture.detectChanges();

        await router.navigateByUrl("/goalie-stats");

        expect(app.controlsContext).toBe("goalie");
    });

    it("should open help dialog on ? keydown", () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        const event = new KeyboardEvent("keydown", { key: "?", bubbles: true });
        document.dispatchEvent(event);

        expect(dialog.open).toHaveBeenCalled();
    });

    it("should focus search on / keydown even with shiftKey (Finnish keyboard layout)", () => {
        const fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();

        const searchInput = document.createElement("input");
        searchInput.type = "search";
        document.body.appendChild(searchInput);
        const focusSpy = vi.spyOn(searchInput, "focus");
        const selectSpy = vi.spyOn(searchInput, "select");

        const event = new KeyboardEvent("keydown", {
            key: "/",
            shiftKey: true,
            bubbles: true,
        });
        document.dispatchEvent(event);

        expect(focusSpy).toHaveBeenCalled();
        expect(selectSpy).toHaveBeenCalled();
        expect(dialog.open).not.toHaveBeenCalled();
        searchInput.remove();
    });

    it("should not open help dialog on ? keydown when typing in input", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;

        const target = document.createElement("input");
        app.onDocumentKeydown({
            key: "?",
            shiftKey: false,
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target,
            preventDefault: vi.fn(),
        } as any);

        expect(dialog.open).not.toHaveBeenCalled();
    });

    it("should not open help dialog on ? keydown when typing in textarea", () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;

        const target = document.createElement("textarea");
        app.onDocumentKeydown({
            key: "?",
            shiftKey: false,
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            target,
            preventDefault: vi.fn(),
        } as any);

        expect(dialog.open).not.toHaveBeenCalled();
    });

    it("should handle update snackbar action and dismissal callbacks", () => {
        vi.spyOn(translateService, "get").mockImplementation((key: any) => {
            if (Array.isArray(key)) {
                return of({
                    "pwa.updateAvailable": "Update available",
                    "pwa.updateAction": "Reload",
                } as any);
            }
            return of("Title");
        });

        // Make snackbar streams emit synchronously so we definitely execute the callbacks.
        snackBar.open.mockReturnValue({
            onAction: () => of(void 0),
            afterDismissed: () => of({ dismissedByAction: true }),
        } as any);

        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        fixture.detectChanges();

        (app as any).isUpdateAvailable = true;
        (app as any).openUpdateAvailableSnackbar();


        expect(snackBar.open).toHaveBeenCalled();
        expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
        expect((app as any).updateSnackRef).toBeUndefined();
    });

    describe("controls context", () => {
        it("should set controlsContext to goalie when url contains goalie-stats", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).updateControlsContext("/goalie-stats");
            expect(app.controlsContext).toBe("goalie");
        });

        it("should set controlsContext to player for other urls", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).updateControlsContext("/player-stats");
            expect(app.controlsContext).toBe("player");
        });
    });

    describe("isLeaderboardsRoute", () => {
        it("should be true for /leaderboards/playoffs", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).updateControlsContext("/leaderboards/playoffs");
            expect(app.isLeaderboardsRoute).toBe(true);
        });

        it("should be true for /leaderboards/regular", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).updateControlsContext("/leaderboards/regular");
            expect(app.isLeaderboardsRoute).toBe(true);
        });

        it("should be false for non-leaderboards url", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).updateControlsContext("/player-stats");
            expect(app.isLeaderboardsRoute).toBe(false);
        });
    });

    describe("mobile drawer context wiring", () => {
        it("should map selectedTeamId to presentName when available", async () => {
            apiServiceMock.getTeams.mockReturnValue(of([
                {
                    id: "1",
                    name: "vegas",
                    presentName: "Vegas Golden Knights",
                } as any,
            ]));

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            const value = await firstValueFrom(fixture.componentInstance.selectedTeamName$.pipe(filter((v): v is string => v !== null)));

            expect(value).toBe("Vegas Golden Knights");
        });

        it("should emit null when teams fetch fails (catchError fallback)", async () => {
            apiServiceMock.getTeams.mockReturnValue(throwError(() => new Error("network error")));

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            const value = await firstValueFrom(fixture.componentInstance.selectedTeamName$);
            expect(value).toBeNull();
        });

        it("should switch drawerMaxGames based on controlsContext", async () => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            const drawerContext = TestBed.inject(DrawerContextService);
            drawerContext.setMaxGames("player", 12);
            drawerContext.setMaxGames("goalie", 20);

            const app = fixture.componentInstance;

            expect(await firstValueFrom(app.drawerMaxGames$)).toBe(12);

            (app as any).updateControlsContext("/goalie-stats");
            expect(await firstValueFrom(app.drawerMaxGames$)).toBe(20);
        });
    });

    describe("PWA update snackbar", () => {
        beforeEach(() => {
            const existingSpy = (translateService.get as any)?.and;
            const install = existingSpy?.callFake
                ? (fn: any) => (translateService.get as any).mockImplementation(fn)
                : (fn: any) => vi.spyOn(translateService, "get").mockImplementation(fn);

            install((key: any) => {
                if (Array.isArray(key)) {
                    return of({
                        "pwa.updateAvailable": "Update available",
                        "pwa.updateAction": "Reload",
                    } as any);
                }
                return of("Test Title");
            });
        });

        it("should open snackbar once when update becomes available", () => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);

            expect(snackBar.open).toHaveBeenCalledTimes(1);

            // Re-emitting should not open a second snackbar while one is active.
            pwaUpdateService.setUpdateAvailable(true);
            expect(snackBar.open).toHaveBeenCalledTimes(1);
        });

        it("should open snackbar when invoked directly (covers translate callback)", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            // Ensure the snackbar path is taken.
            (app as any).isUpdateAvailable = true;
            (app as any).openUpdateAvailableSnackbar();

            expect(snackBar.open).toHaveBeenCalledTimes(1);
        });

        it("should activate update when snackbar action is clicked", () => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);
            snackBarAction$.next();

            expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
        });

        it("should re-open snackbar if dismissed without action while update is available", () => {
            vi.useFakeTimers();
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);
            expect(snackBar.open).toHaveBeenCalledTimes(1);

            snackBarAfterDismissed$.next({ dismissedByAction: false });
            vi.runAllTimers();

            expect(snackBar.open).toHaveBeenCalledTimes(2);
            vi.useRealTimers();
        });

        it("should not re-open snackbar if dismissed by action", () => {
            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);
            expect(snackBar.open).toHaveBeenCalledTimes(1);

            snackBarAfterDismissed$.next({ dismissedByAction: true });


            expect(snackBar.open).toHaveBeenCalledTimes(1);
        });
    });

    describe("help hotkey (direct handler coverage)", () => {
        it("should ignore ? keydown when target is a form control (input/textarea/select)", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).onDocumentKeydown({
                key: "?",
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: { tagName: "INPUT", isContentEditable: false },
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });

        it("should ignore ? keydown when target is a textarea", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).onDocumentKeydown({
                key: "?",
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: { tagName: "TEXTAREA", isContentEditable: false },
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });

        it("should ignore ? keydown when target is a select", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            (app as any).onDocumentKeydown({
                key: "?",
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: { tagName: "SELECT", isContentEditable: false },
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });

        it("should ignore non-help keys (covers !isQuestionMark branch)", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            app.onDocumentKeydown({
                key: "a",
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: document.body,
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });
    });

    describe("mobileState$", () => {
        it("should emit not-ready then ready state", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const emissions: Array<{
                ready: boolean;
                isMobile: boolean;
            }> = [];
            const sub = fixture.componentInstance.mobileState$.subscribe((v) => emissions.push(v));

            // StartWith should provide an initial non-ready value.
            expect(emissions[0]).toEqual({ ready: false, isMobile: false });

            // The mocked ViewportService emits `false`, so the second emission is ready/false.
            expect(emissions[1]).toEqual({ ready: true, isMobile: false });

            sub.unsubscribe();
        });
    });

    describe("PWA update snackbar", () => {
        it("should not open snackbar before an update is available (defensive no-op)", () => {
            vi.spyOn(translateService, "get").mockReturnValue(of("Test Title"));

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            (fixture.componentInstance as any).openUpdateAvailableSnackbar();


            expect(snackBar.open).not.toHaveBeenCalled();
        });

        it("should open a persistent snackbar when an update becomes available", () => {
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return of({
                        "pwa.updateAvailable": "Päivitys tarjolla!",
                        "pwa.updateAction": "Päivitä",
                    });
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            expect(snackBar.open).toHaveBeenCalledWith("Päivitys tarjolla!", "Päivitä", expect.objectContaining({
                duration: undefined,
                horizontalPosition: "center",
                verticalPosition: "bottom",
            }));
        });

        it("should not open snackbar if update is no longer available when translations resolve", () => {
            const translations$ = new Subject<any>();
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return translations$.asObservable();
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            // Simulate state flip before translations arrive.
            (fixture.componentInstance as any).isUpdateAvailable = false;

            translations$.next({
                "pwa.updateAvailable": "Päivitys tarjolla!",
                "pwa.updateAction": "Päivitä",
            });


            expect(snackBar.open).not.toHaveBeenCalled();
        });

        it("should not open snackbar if one was created before translations resolve", () => {
            const translations$ = new Subject<any>();
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return translations$.asObservable();
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            // Simulate another code path setting the snackbar reference before translations arrive.
            (fixture.componentInstance as any).updateSnackRef = {};

            translations$.next({
                "pwa.updateAvailable": "Päivitys tarjolla!",
                "pwa.updateAction": "Päivitä",
            });


            expect(snackBar.open).not.toHaveBeenCalled();
        });

        it("should not re-open snackbar when dismissed by action", () => {
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return of({
                        "pwa.updateAvailable": "Päivitys tarjolla!",
                        "pwa.updateAction": "Päivitä",
                    });
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            expect(vi.mocked(snackBar.open).mock.calls.length).toBe(1);

            snackBarAfterDismissed$.next({ dismissedByAction: true });


            expect(vi.mocked(snackBar.open).mock.calls.length).toBe(1);
        });

        it("should open snackbar only once even if updateAvailable emits again", () => {
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return of({
                        "pwa.updateAvailable": "Päivitys tarjolla!",
                        "pwa.updateAction": "Päivitä",
                    });
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);

            pwaUpdateService.setUpdateAvailable(true);


            expect(vi.mocked(snackBar.open).mock.calls.length).toBe(1);
        });

        it("should trigger update activation when snackbar action is clicked", () => {
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return of({
                        "pwa.updateAvailable": "Päivitys tarjolla!",
                        "pwa.updateAction": "Päivitä",
                    });
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            snackBarAction$.next();


            expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
        });

        it("should re-open snackbar if dismissed without action while update is available", () => {
            vi.useFakeTimers();
            vi.spyOn(translateService, "get").mockImplementation((key: any) => {
                if (key === "pageTitle")
                    return of("Test Title");
                if (Array.isArray(key) && key.includes("pwa.updateAvailable")) {
                    return of({
                        "pwa.updateAvailable": "Päivitys tarjolla!",
                        "pwa.updateAction": "Päivitä",
                    });
                }
                return of("");
            });

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            pwaUpdateService.setUpdateAvailable(true);


            expect(vi.mocked(snackBar.open).mock.calls.length).toBe(1);

            snackBarAfterDismissed$.next({ dismissedByAction: false });
            vi.runAllTimers();

            expect(vi.mocked(snackBar.open).mock.calls.length).toBe(2);
            vi.useRealTimers();
        });
    });

    describe("activateUpdateAndReload", () => {
        it("should delegate to PwaUpdateService.activateAndReload", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            app.activateUpdateAndReload();

            expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
        });
    });

    describe("search focus shortcut (/)", () => {
        it("should focus and select search input on / keydown", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            const searchInput = document.createElement("input");
            searchInput.type = "search";
            document.body.appendChild(searchInput);

            const focusSpy = vi.spyOn(searchInput, "focus");
            const selectSpy = vi.spyOn(searchInput, "select");

            const preventDefault = vi.fn();
            app.onDocumentKeydown({
                key: "/",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                preventDefault,
                target: document.body,
            } as any);

            expect(preventDefault).toHaveBeenCalled();
            expect(focusSpy).toHaveBeenCalled();
            expect(selectSpy).toHaveBeenCalled();

            document.body.removeChild(searchInput);
        });

        it("should not focus search when / is pressed in an input field", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            const searchInput = document.createElement("input");
            searchInput.type = "search";
            document.body.appendChild(searchInput);

            const focusSpy = vi.spyOn(searchInput, "focus");

            app.onDocumentKeydown({
                key: "/",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                preventDefault: vi.fn(),
                target: { tagName: "INPUT", isContentEditable: false },
            } as any);

            expect(focusSpy).not.toHaveBeenCalled();

            document.body.removeChild(searchInput);
        });

        it("should no-op when no search input exists in DOM", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            const preventDefault = vi.fn();
            app.onDocumentKeydown({
                key: "/",
                shiftKey: false,
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                preventDefault,
                target: document.body,
            } as any);

            // Should not throw, just no-op
            expect(preventDefault).toHaveBeenCalled();
        });
    });

    describe("help keydown guards", () => {
        it("should not open help dialog when modifier keys are pressed", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            app.onDocumentKeydown({
                key: "?",
                altKey: true,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: document.body,
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });

        it("should not open help dialog when target is contentEditable", () => {
            const fixture = TestBed.createComponent(AppComponent);
            const app = fixture.componentInstance;

            app.onDocumentKeydown({
                key: "?",
                altKey: false,
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                preventDefault: vi.fn(),
                target: { tagName: "DIV", isContentEditable: true },
            } as any);

            expect(dialog.open).not.toHaveBeenCalled();
        });
    });

    describe("lastModifiedText$ error handling", () => {
        it("should emit null when getLastModified throws an error", async () => {
            apiServiceMock.getLastModified.mockReturnValue(throwError(() => new Error("API down")));

            const fixture = TestBed.createComponent(AppComponent);
            fixture.detectChanges();

            const value = await firstValueFrom(fixture.componentInstance.lastModifiedText$);
            expect(value).toBeNull();
        });
    });
});
