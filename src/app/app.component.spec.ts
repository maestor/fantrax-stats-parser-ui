import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, filter, firstValueFrom, of, Subject, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewportService } from '@services/viewport.service';
import { ApiService } from '@services/api.service';
import { TeamService } from '@services/team.service';
import { DrawerContextService } from '@services/drawer-context.service';
import { PwaUpdateService } from '@services/pwa-update.service';

class TeamServiceMock {
  private readonly selectedTeamIdSubject = new BehaviorSubject<string>('1');
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

  readonly activateAndReload = jasmine.createSpy('activateAndReload');

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

describe('AppComponent', () => {
  let translateService: TranslateService;
  let titleService: Title;
  let dialog: { open: jasmine.Spy };
  let apiServiceMock: jasmine.SpyObj<
    Pick<ApiService, 'getTeams' | 'getSeasons' | 'getLastModified'>
  >;
  let viewportServiceMock: ViewportServiceMock;
  let pwaUpdateService: PwaUpdateServiceMock;
  let snackBar: jasmine.SpyObj<Pick<MatSnackBar, 'open'>>;
  let snackBarAction$: Subject<void>;
  let snackBarAfterDismissed$: Subject<{ dismissedByAction: boolean }>;
  @Component({ template: '' })
  class DummyRouteComponent {}

  beforeEach(async () => {
    dialog = { open: jasmine.createSpy('open') };

    pwaUpdateService = new PwaUpdateServiceMock();

    viewportServiceMock = new ViewportServiceMock();

    snackBarAction$ = new Subject<void>();
    snackBarAfterDismissed$ = new Subject<{ dismissedByAction: boolean }>();
    snackBar = jasmine.createSpyObj<Pick<MatSnackBar, 'open'>>('MatSnackBar', [
      'open',
    ]);
    snackBar.open.and.returnValue({
      onAction: () => snackBarAction$.asObservable(),
      afterDismissed: () => snackBarAfterDismissed$.asObservable(),
    } as any);

    apiServiceMock = jasmine.createSpyObj<
      Pick<ApiService, 'getTeams' | 'getSeasons' | 'getLastModified'>
    >(
      'ApiService',
      ['getTeams', 'getSeasons', 'getLastModified']
    );
    apiServiceMock.getTeams.and.returnValue(of([]));
    apiServiceMock.getSeasons.and.returnValue(of([]));
    apiServiceMock.getLastModified.and.returnValue(
      of({ lastModified: '2026-01-30T11:03:07.210Z' })
    );

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([{ path: '**', component: DummyRouteComponent }]),
        Title,
        { provide: ViewportService, useValue: viewportServiceMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: TeamService, useClass: TeamServiceMock },
        DrawerContextService,
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .overrideProvider(PwaUpdateService, { useValue: pwaUpdateService })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    translateService = TestBed.inject(TranslateService);
    titleService = TestBed.inject(Title);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render last modified under the title on desktop', fakeAsync(() => {
    viewportServiceMock.setMobile(false);
    apiServiceMock.getLastModified.and.returnValue(
      of({ lastModified: '2026-01-30T11:03:07.210Z' })
    );

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const lastModified = el.querySelector('.last-modified');
    expect(lastModified).toBeTruthy();

    const text = (lastModified?.textContent || '').replace(/\s+/g, ' ').trim();
    // Europe/Helsinki: 11:03Z -> 13:03 local in January
    expect(text).toContain('30.01.2026');
    expect(text).toContain('13.03');
  }));

  it('should render last modified in the settings drawer on mobile (not under title)', fakeAsync(() => {
    viewportServiceMock.setMobile(true);
    apiServiceMock.getLastModified.and.returnValue(
      of({ lastModified: '2026-01-30T11:03:07.210Z' })
    );

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const drawerLastModified = el.querySelector('.settings-drawer-last-modified');
    expect(drawerLastModified).toBeTruthy();

    const desktopLastModified = el.querySelector('.last-modified');
    expect(desktopLastModified).toBeFalsy();
  }));

  it('should set page title on init', (done) => {
    spyOn(translateService, 'get').and.returnValue(of('Test Title'));
    spyOn(titleService, 'setTitle');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    setTimeout(() => {
      expect(translateService.get).toHaveBeenCalledWith('pageTitle');
      expect(titleService.setTitle).toHaveBeenCalledWith('Test Title');
      done();
    }, 10);
  });

  it('should update page title for each emission from translateService', () => {
    const translateSubject = new Subject<string>();
    spyOn(translateService, 'get').and.returnValue(
      translateSubject.asObservable()
    );
    const setTitleSpy = spyOn(titleService, 'setTitle');

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    translateSubject.next('First Title');
    translateSubject.next('Second Title');

    expect(setTitleSpy.calls.count()).toBe(2);
    expect(setTitleSpy.calls.mostRecent().args[0]).toBe('Second Title');
  });

  it('should have tabPanel ViewChild', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.tabPanel).toBeDefined();
  });

  it('should open help dialog when openHelpDialog is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.openHelpDialog();
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should update controls context and close settings drawer on navigation', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    void router.navigateByUrl('/goalie-stats');
    tick();

    expect(app.controlsContext).toBe('goalie');
  }));

  it('should open help dialog on ? keydown', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', { key: '?', bubbles: true });
    document.dispatchEvent(event);

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open help dialog on Shift+/ keydown', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', {
      key: '/',
      shiftKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should not open help dialog on ? keydown when typing in input', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const target = document.createElement('input');
    app.onDocumentKeydown({
      key: '?',
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      target,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any);

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should not open help dialog on ? keydown when typing in textarea', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const target = document.createElement('textarea');
    app.onDocumentKeydown({
      key: '?',
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      target,
      preventDefault: jasmine.createSpy('preventDefault'),
    } as any);

    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should handle update snackbar action and dismissal callbacks', fakeAsync(() => {
    spyOn(translateService, 'get').and.callFake((key: any) => {
      if (Array.isArray(key)) {
        return of({
          'pwa.updateAvailable': 'Update available',
          'pwa.updateAction': 'Reload',
        } as any);
      }
      return of('Title');
    });

    // Make snackbar streams emit synchronously so we definitely execute the callbacks.
    snackBar.open.and.returnValue({
      onAction: () => of(void 0),
      afterDismissed: () => of({ dismissedByAction: true }),
    } as any);

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    (app as any).isUpdateAvailable = true;
    (app as any).openUpdateAvailableSnackbar();
    tick();

    expect(snackBar.open).toHaveBeenCalled();
    expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
    expect((app as any).updateSnackRef).toBeUndefined();
  }));

  describe('controls context', () => {
    it('should set controlsContext to goalie when url contains goalie-stats', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      (app as any).updateControlsContext('/goalie-stats');
      expect(app.controlsContext).toBe('goalie');
    });

    it('should set controlsContext to player for other urls', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      (app as any).updateControlsContext('/player-stats');
      expect(app.controlsContext).toBe('player');
    });
  });

  describe('mobile drawer context wiring', () => {
    it('should map selectedTeamId to a translated team key when available', async () => {
      apiServiceMock.getTeams.and.returnValue(
        of([
          {
            id: '1',
            name: 'vegas',
          } as any,
        ])
      );

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const value = await firstValueFrom(
        fixture.componentInstance.selectedTeamNameKey$.pipe(
          filter((v): v is string => v !== null)
        )
      );

      expect(value).toBe('teams.vegas');
    });

    it('should emit null when teams fetch fails (catchError fallback)', async () => {
      apiServiceMock.getTeams.and.returnValue(
        throwError(() => new Error('network error'))
      );

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const value = await firstValueFrom(fixture.componentInstance.selectedTeamNameKey$);
      expect(value).toBeNull();
    });

    it('should switch drawerMaxGames based on controlsContext', async () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const drawerContext = TestBed.inject(DrawerContextService);
      drawerContext.setMaxGames('player', 12);
      drawerContext.setMaxGames('goalie', 20);

      const app = fixture.componentInstance;

      expect(await firstValueFrom(app.drawerMaxGames$)).toBe(12);

      (app as any).updateControlsContext('/goalie-stats');
      expect(await firstValueFrom(app.drawerMaxGames$)).toBe(20);
    });
  });

  describe('skip link', () => {
    it('should preventDefault and no-op when target container is missing', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      const doc = (app as any).document as Document;
      spyOn(doc, 'getElementById').and.returnValue(null);

      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      app.skipToTarget('missing', event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(doc.getElementById).toHaveBeenCalledWith('missing');
    });

    it('should no-op when container has no first data row yet', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      const doc = (app as any).document as Document;

      const container = doc.createElement('div');
      container.id = 'stats-table-test-empty';
      doc.body.appendChild(container);

      const replaceSpy = spyOn(doc.defaultView!.history, 'replaceState');

      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      app.skipToTarget('stats-table-test-empty', event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it('should focus the first row, scroll it into view, and update URL fragment', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      const doc = (app as any).document as Document;

      const container = doc.createElement('div');
      container.id = 'stats-table-test';

      const table = doc.createElement('table');
      const tbody = doc.createElement('tbody');
      const firstRow = doc.createElement('tr');
      firstRow.setAttribute('data-row-index', '0');
      (firstRow as any).scrollIntoView = jasmine.createSpy('scrollIntoView');
      (firstRow as any).focus = jasmine.createSpy('focus');
      tbody.appendChild(firstRow);
      table.appendChild(tbody);
      container.appendChild(table);
      doc.body.appendChild(container);

      spyOn(container, 'querySelector').and.returnValue(firstRow as any);

      const replaceSpy = spyOn(doc.defaultView!.history, 'replaceState');

      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      app.skipToTarget('stats-table-test', event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(replaceSpy).toHaveBeenCalledWith(null, '', '#stats-table-test');
      expect((firstRow as any).scrollIntoView).toHaveBeenCalled();
      expect((firstRow as any).focus).toHaveBeenCalledWith({ preventScroll: true });
    });
  });

  describe('PWA update snackbar', () => {
    beforeEach(() => {
      const existingSpy = (translateService.get as any)?.and;
      const install = existingSpy?.callFake
        ? (fn: any) => (translateService.get as any).and.callFake(fn)
        : (fn: any) => spyOn(translateService, 'get').and.callFake(fn);

      install((key: any) => {
        if (Array.isArray(key)) {
          return of({
            'pwa.updateAvailable': 'Update available',
            'pwa.updateAction': 'Reload',
          } as any);
        }
        return of('Test Title');
      });
    });

    it('should open snackbar once when update becomes available', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);

      expect(snackBar.open).toHaveBeenCalledTimes(1);

      // Re-emitting should not open a second snackbar while one is active.
      pwaUpdateService.setUpdateAvailable(true);
      expect(snackBar.open).toHaveBeenCalledTimes(1);
    });

    it('should open snackbar when invoked directly (covers translate callback)', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      // Ensure the snackbar path is taken.
      (app as any).isUpdateAvailable = true;
      (app as any).openUpdateAvailableSnackbar();

      expect(snackBar.open).toHaveBeenCalledTimes(1);
    });

    it('should activate update when snackbar action is clicked', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      snackBarAction$.next();

      expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
    });

    it('should re-open snackbar if dismissed without action while update is available', fakeAsync(() => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      expect(snackBar.open).toHaveBeenCalledTimes(1);

      snackBarAfterDismissed$.next({ dismissedByAction: false });
      tick(0);

      expect(snackBar.open).toHaveBeenCalledTimes(2);
    }));

    it('should not re-open snackbar if dismissed by action', fakeAsync(() => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      expect(snackBar.open).toHaveBeenCalledTimes(1);

      snackBarAfterDismissed$.next({ dismissedByAction: true });
      tick(0);

      expect(snackBar.open).toHaveBeenCalledTimes(1);
    }));
  });

  describe('help hotkey (direct handler coverage)', () => {
    it('should ignore ? keydown when target is a form control (input/textarea/select)', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      (app as any).onDocumentKeydown({
        key: '?',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { tagName: 'INPUT', isContentEditable: false },
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should ignore ? keydown when target is a textarea', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      (app as any).onDocumentKeydown({
        key: '?',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { tagName: 'TEXTAREA', isContentEditable: false },
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should ignore ? keydown when target is a select', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      (app as any).onDocumentKeydown({
        key: '?',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { tagName: 'SELECT', isContentEditable: false },
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should ignore non-help keys (covers !isQuestionMark branch)', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      app.onDocumentKeydown({
        key: 'a',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: document.body,
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('mobileState$', () => {
    it('should emit not-ready then ready state', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const emissions: Array<{ ready: boolean; isMobile: boolean }> = [];
      const sub = fixture.componentInstance.mobileState$.subscribe((v) => emissions.push(v));

      // StartWith should provide an initial non-ready value.
      expect(emissions[0]).toEqual({ ready: false, isMobile: false });

      // The mocked ViewportService emits `false`, so the second emission is ready/false.
      expect(emissions[1]).toEqual({ ready: true, isMobile: false });

      sub.unsubscribe();
    });
  });

  describe('PWA update snackbar', () => {
    it('should not open snackbar before an update is available (defensive no-op)', fakeAsync(() => {
      spyOn(translateService, 'get').and.returnValue(of('Test Title'));

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      (fixture.componentInstance as any).openUpdateAvailableSnackbar();
      tick();

      expect(snackBar.open).not.toHaveBeenCalled();
    }));

    it('should open a persistent snackbar when an update becomes available', fakeAsync(() => {
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return of({
            'pwa.updateAvailable': 'Päivitys tarjolla!',
            'pwa.updateAction': 'Päivitä',
          });
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Päivitys tarjolla!',
        'Päivitä',
        jasmine.objectContaining({
          duration: undefined,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        })
      );
    }));

    it('should not open snackbar if update is no longer available when translations resolve', fakeAsync(() => {
      const translations$ = new Subject<any>();
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return translations$.asObservable();
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      // Simulate state flip before translations arrive.
      (fixture.componentInstance as any).isUpdateAvailable = false;

      translations$.next({
        'pwa.updateAvailable': 'Päivitys tarjolla!',
        'pwa.updateAction': 'Päivitä',
      });
      tick();

      expect(snackBar.open).not.toHaveBeenCalled();
    }));

    it('should not open snackbar if one was created before translations resolve', fakeAsync(() => {
      const translations$ = new Subject<any>();
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return translations$.asObservable();
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      // Simulate another code path setting the snackbar reference before translations arrive.
      (fixture.componentInstance as any).updateSnackRef = {};

      translations$.next({
        'pwa.updateAvailable': 'Päivitys tarjolla!',
        'pwa.updateAction': 'Päivitä',
      });
      tick();

      expect(snackBar.open).not.toHaveBeenCalled();
    }));

    it('should not re-open snackbar when dismissed by action', fakeAsync(() => {
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return of({
            'pwa.updateAvailable': 'Päivitys tarjolla!',
            'pwa.updateAction': 'Päivitä',
          });
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      expect(snackBar.open.calls.count()).toBe(1);

      snackBarAfterDismissed$.next({ dismissedByAction: true });
      tick();

      expect(snackBar.open.calls.count()).toBe(1);
    }));

    it('should open snackbar only once even if updateAvailable emits again', fakeAsync(() => {
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return of({
            'pwa.updateAvailable': 'Päivitys tarjolla!',
            'pwa.updateAction': 'Päivitä',
          });
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();
      pwaUpdateService.setUpdateAvailable(true);
      tick();

      expect(snackBar.open.calls.count()).toBe(1);
    }));

    it('should trigger update activation when snackbar action is clicked', fakeAsync(() => {
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return of({
            'pwa.updateAvailable': 'Päivitys tarjolla!',
            'pwa.updateAction': 'Päivitä',
          });
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      snackBarAction$.next();
      tick();

      expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
    }));

    it('should re-open snackbar if dismissed without action while update is available', fakeAsync(() => {
      spyOn(translateService, 'get').and.callFake((key: any) => {
        if (key === 'pageTitle') return of('Test Title');
        if (Array.isArray(key) && key.includes('pwa.updateAvailable')) {
          return of({
            'pwa.updateAvailable': 'Päivitys tarjolla!',
            'pwa.updateAction': 'Päivitä',
          });
        }
        return of('');
      });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      pwaUpdateService.setUpdateAvailable(true);
      tick();

      expect(snackBar.open.calls.count()).toBe(1);

      snackBarAfterDismissed$.next({ dismissedByAction: false });
      tick();

      expect(snackBar.open.calls.count()).toBe(2);
    }));
  });

  describe('activateUpdateAndReload', () => {
    it('should delegate to PwaUpdateService.activateAndReload', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      app.activateUpdateAndReload();

      expect(pwaUpdateService.activateAndReload).toHaveBeenCalled();
    });
  });

  describe('help keydown guards', () => {
    it('should not open help dialog when modifier keys are pressed', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      app.onDocumentKeydown({
        key: '?',
        altKey: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: document.body,
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should not open help dialog when target is contentEditable', () => {
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;

      const editable = document.createElement('div');
      editable.contentEditable = 'true';

      app.onDocumentKeydown({
        key: '?',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: editable,
      } as any);

      expect(dialog.open).not.toHaveBeenCalled();
    });
  });
});
