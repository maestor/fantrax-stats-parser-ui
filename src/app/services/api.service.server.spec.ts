import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { CacheService } from './cache.service';

describe('ApiService server rendering', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        ApiService,
        CacheService,
        {
          provide: PLATFORM_ID,
          useValue: 'server',
        },
      ],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('skips backend requests during server prerendering', async () => {
    await expect(firstValueFrom(service.getTeams())).rejects.toThrow(
      'Server prerender skips API requests.',
    );

    httpMock.expectNone('http://localhost:3000/teams');
  });
});
