import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

describe('AppComponent', () => {
  let translateService: TranslateService;
  let titleService: Title;
  let dialog: { open: jasmine.Spy };

  beforeEach(async () => {
    dialog = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [AppComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), Title],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    translateService = TestBed.inject(TranslateService);
    titleService = TestBed.inject(Title);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

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
    fixture.detectChanges();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: '?', bubbles: true });
    input.dispatchEvent(event);

    expect(dialog.open).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

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
});
