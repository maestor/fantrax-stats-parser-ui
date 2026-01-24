import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { PwaUpdateService } from '../pwa-update.service';

class SwUpdateMock {
  isEnabled = true;
  readonly versionUpdates = new Subject<any>();

  activateUpdate = jasmine.createSpy('activateUpdate').and.resolveTo();
  checkForUpdate = jasmine.createSpy('checkForUpdate').and.resolveTo(true);
}

describe('PwaUpdateService', () => {
  class FakeDocument extends EventTarget {
    visibilityState: DocumentVisibilityState = 'visible';
    defaultView = {
      location: {
        reload: jasmine.createSpy('reload'),
      },
    } as any;
  }

  it('should no-op on non-browser platforms', () => {
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    expect(() => TestBed.inject(PwaUpdateService)).not.toThrow();
  });

  it('should no-op when SwUpdate is not provided', () => {
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    const service = TestBed.inject(PwaUpdateService);

    let latest: boolean | undefined;
    service.updateAvailable$.subscribe((v) => (latest = v));
    expect(latest).toBe(false);
  });

  it('should flip updateAvailable$ to true on VERSION_READY', (done) => {
    const doc = new FakeDocument();

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SwUpdate, useClass: SwUpdateMock },
        { provide: DOCUMENT, useValue: doc },
      ],
    });

    const service = TestBed.inject(PwaUpdateService);
    const swUpdate = TestBed.inject(SwUpdate) as unknown as SwUpdateMock;

    const values: boolean[] = [];
    const sub = service.updateAvailable$.subscribe((v) => {
      values.push(v);
      if (values.includes(true)) {
        sub.unsubscribe();
        expect(values[0]).toBe(false);
        expect(values[values.length - 1]).toBe(true);
        done();
      }
    });

    swUpdate.versionUpdates.next({ type: 'VERSION_READY' });
  });

  it('should check for updates when app becomes visible', () => {
    const doc = new FakeDocument();
    doc.visibilityState = 'hidden';

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SwUpdate, useClass: SwUpdateMock },
        { provide: DOCUMENT, useValue: doc },
      ],
    });

    const swUpdate = TestBed.inject(SwUpdate) as unknown as SwUpdateMock;
    TestBed.inject(PwaUpdateService);

    doc.dispatchEvent(new Event('visibilitychange'));
    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();

    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(swUpdate.checkForUpdate).toHaveBeenCalled();
  });

  it('activateAndReload should early-return when SwUpdate is disabled', async () => {
    const doc = new FakeDocument();
    const swUpdateMock = new SwUpdateMock();
    swUpdateMock.isEnabled = false;

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: DOCUMENT, useValue: doc },
      ],
    });

    const service = TestBed.inject(PwaUpdateService);
    await service.activateAndReload();

    expect(swUpdateMock.activateUpdate).not.toHaveBeenCalled();
    expect(doc.defaultView.location.reload).not.toHaveBeenCalled();
  });

  it('should activate update and reload on activateAndReload()', async () => {
    const doc = new FakeDocument();

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SwUpdate, useClass: SwUpdateMock },
        { provide: DOCUMENT, useValue: doc },
      ],
    });

    const service = TestBed.inject(PwaUpdateService);
    const swUpdate = TestBed.inject(SwUpdate) as unknown as SwUpdateMock;

    await service.activateAndReload();

    expect(swUpdate.activateUpdate).toHaveBeenCalled();
    expect(doc.defaultView.location.reload).toHaveBeenCalled();
  });
});
