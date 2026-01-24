import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
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
  let service: PwaUpdateService;
  let swUpdate: SwUpdateMock;
  let fakeDocument: any;
  let listeners: Record<string, Array<() => void>>;

  beforeEach(() => {
    listeners = {};
    fakeDocument = {
      visibilityState: 'visible',
      addEventListener: (type: string, handler: () => void) => {
        listeners[type] = listeners[type] ?? [];
        listeners[type].push(handler);
      },
      removeEventListener: (type: string, handler: () => void) => {
        listeners[type] = (listeners[type] ?? []).filter((h) => h !== handler);
      },
      defaultView: {
        location: {
          reload: jasmine.createSpy('reload'),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useClass: SwUpdateMock },
        { provide: DOCUMENT, useValue: fakeDocument },
      ],
    });

    service = TestBed.inject(PwaUpdateService);
    swUpdate = TestBed.inject(SwUpdate) as unknown as SwUpdateMock;
  });

  it('should flip updateAvailable$ to true on VERSION_READY', (done) => {
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

  it('should activate update and reload on activateAndReload()', async () => {
    await service.activateAndReload();

    expect(swUpdate.activateUpdate).toHaveBeenCalled();
    expect(fakeDocument.defaultView.location.reload).toHaveBeenCalled();
  });

  it('should check for updates when app becomes visible', () => {
    const handler = listeners['visibilitychange']?.[0];
    expect(handler).toBeDefined();

    handler?.();
    expect(swUpdate.checkForUpdate).toHaveBeenCalled();
  });
});
