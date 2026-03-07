import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { firstValueFrom, Subject } from 'rxjs';

import { PwaUpdateService } from './pwa-update.service';

type FakeSwUpdate = {
  isEnabled: boolean;
  versionUpdates: Subject<VersionEvent>;
  checkForUpdate: ReturnType<typeof vi.fn>;
  activateUpdate: ReturnType<typeof vi.fn>;
};

type FakeDocument = EventTarget & {
  visibilityState: DocumentVisibilityState;
  defaultView: { location: { reload: ReturnType<typeof vi.fn> } };
};

function createFakeSwUpdate(enabled: boolean): FakeSwUpdate {
  return {
    isEnabled: enabled,
    versionUpdates: new Subject<VersionEvent>(),
    checkForUpdate: vi.fn().mockResolvedValue(true),
    activateUpdate: vi.fn().mockResolvedValue(undefined),
  };
}

function createFakeDocument(): FakeDocument {
  const target = new EventTarget() as FakeDocument;
  target.visibilityState = 'hidden';
  target.defaultView = {
    location: {
      reload: vi.fn(),
    },
  };
  return target;
}

describe('PwaUpdateService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function configure(options: {
    platformId?: 'browser' | 'server';
    swUpdate?: FakeSwUpdate | null;
    document?: FakeDocument;
  } = {}) {
    const fakeDocument = options.document ?? createFakeDocument();
    const providers: Provider[] = [
      PwaUpdateService,
      { provide: PLATFORM_ID, useValue: options.platformId ?? 'browser' },
      { provide: DOCUMENT, useValue: fakeDocument as unknown as Document },
    ];

    if (options.swUpdate !== undefined) {
      providers.push({
        provide: SwUpdate,
        useValue: options.swUpdate as unknown as SwUpdate,
      });
    }

    TestBed.configureTestingModule({
      providers,
    });

    return {
      service: TestBed.inject(PwaUpdateService),
      document: fakeDocument,
    };
  }

  it('does nothing on the server platform', async () => {
    const swUpdate = createFakeSwUpdate(true);
    const { service } = configure({ platformId: 'server', swUpdate });

    await expect(firstValueFrom(service.updateAvailable$)).resolves.toBe(false);

    swUpdate.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);
    expect(swUpdate.checkForUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when SwUpdate is missing', () => {
    const noSw = configure();
    expect(noSw.service).toBeTruthy();
  });

  it('does nothing when SwUpdate is disabled', () => {
    const disabledSw = createFakeSwUpdate(false);
    configure({ swUpdate: disabledSw });
    disabledSw.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);

    expect(disabledSw.checkForUpdate).not.toHaveBeenCalled();
  });

  it('marks an update as available when VERSION_READY is emitted', async () => {
    const swUpdate = createFakeSwUpdate(true);
    const { service } = configure({ swUpdate });

    const nextValue = firstValueFrom(service.updateAvailable$);
    swUpdate.versionUpdates.next({ type: 'VERSION_READY' } as VersionEvent);

    await expect(nextValue).resolves.toBe(false);
    await expect(firstValueFrom(service.updateAvailable$)).resolves.toBe(true);
  });

  it('checks for updates when the document becomes visible', () => {
    const swUpdate = createFakeSwUpdate(true);
    const { document } = configure({ swUpdate });

    document.visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
  });

  it('activates the update and reloads the page', async () => {
    const swUpdate = createFakeSwUpdate(true);
    const { service, document } = configure({ swUpdate });

    await service.activateAndReload();

    expect(swUpdate.activateUpdate).toHaveBeenCalledTimes(1);
    expect(document.defaultView.location.reload).toHaveBeenCalledTimes(1);
  });

  it('skips activation when updates are disabled', async () => {
    const swUpdate = createFakeSwUpdate(false);
    const { service, document } = configure({ swUpdate });

    await service.activateAndReload();

    expect(swUpdate.activateUpdate).not.toHaveBeenCalled();
    expect(document.defaultView.location.reload).not.toHaveBeenCalled();
  });
});
