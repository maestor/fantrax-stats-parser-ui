import { render, screen, fireEvent } from '@testing-library/angular';
import { Subject, of, throwError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { PLATFORM_ID } from '@angular/core';

import { OpeningDraftComponent } from './opening-draft.component';
import { ApiService } from '@services/api.service';
import { FooterVisibilityService } from '@services/footer-visibility.service';
import {
  openingDraftsFixture,
  provideDisabledMaterialAnimations,
  waitForBehaviorAssertion,
} from '../../testing/behavior-test-utils';

describe('OpeningDraftComponent', () => {
  function createFooterVisibilityMock() {
    return {
      currentCycle: vi.fn(() => 7),
      markReady: vi.fn(),
    };
  }

  async function renderComponent(options?: {
    apiService?: Partial<ApiService>;
    footerVisibilityService?: ReturnType<typeof createFooterVisibilityMock>;
    platformId?: object | string;
  }) {
    return render(OpeningDraftComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        {
          provide: ApiService,
          useValue: {
            getOpeningDrafts: () => of(openingDraftsFixture),
            ...options?.apiService,
          },
        },
        {
          provide: FooterVisibilityService,
          useValue: options?.footerVisibilityService ?? createFooterVisibilityMock(),
        },
        {
          provide: PLATFORM_ID,
          useValue: options?.platformId ?? 'browser',
        },
      ],
    });
  }

  it('renders opening draft teams in API order and shows traded-pick details inside expanded panels', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const { fixture } = await renderComponent({ footerVisibilityService });

    const panelButtons = await screen.findAllByRole('button', { expanded: false });
    expect(panelButtons.map((button) => button.textContent?.trim())).toEqual([
      'Colorado Avalanche',
      'Dallas Stars',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Colorado Avalanche' }));

    expect(screen.getAllByText(/draft\.openingDraft\.selectionLabel 1/)).toHaveLength(2);
    expect(screen.getByText('Sidney Crosby')).toBeInTheDocument();
    expect(screen.getByText('Corey Perry')).toBeInTheDocument();
    expect(screen.getByText('Carey Price')).toBeInTheDocument();
    expect(screen.getAllByText(/draft\.openingDraft\.originalOwnerLabel/)).toHaveLength(2);
    expect(screen.getByText('Tampa Bay Lightning')).toBeInTheDocument();
    expect(screen.getByText('Edmonton Oilers')).toBeInTheDocument();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows a loading state until the opening draft response resolves', async () => {
    const response$ = new Subject<typeof openingDraftsFixture>();
    const footerVisibilityService = createFooterVisibilityMock();

    const { fixture } = await renderComponent({
      apiService: {
        getOpeningDrafts: () => response$.asObservable(),
      },
      footerVisibilityService,
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).not.toHaveBeenCalled();

    response$.next(openingDraftsFixture);
    response$.complete();

    await waitForBehaviorAssertion(fixture, () => {
      expect(fixture.componentInstance.loading).toBe(false);
      expect(fixture.componentInstance.groups).toEqual(openingDraftsFixture);
      expect(screen.getByText('Colorado Avalanche')).toBeInTheDocument();
    });
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows an empty state when there are no opening draft picks', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getOpeningDrafts: () => of([]),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.noResults')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('shows an API error state when opening draft loading fails', async () => {
    const footerVisibilityService = createFooterVisibilityMock();

    await renderComponent({
      apiService: {
        getOpeningDrafts: () => throwError(() => new Error('opening draft failed')),
      },
      footerVisibilityService,
    });

    expect(await screen.findByText('draft.apiUnavailable')).toBeInTheDocument();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });

  it('keeps the prerendered route in loading state instead of flashing an API error on the server', async () => {
    const footerVisibilityService = createFooterVisibilityMock();
    const getOpeningDrafts = vi.fn(() => throwError(() => new Error('should not run on the server')));

    const { fixture } = await renderComponent({
      apiService: {
        getOpeningDrafts,
      },
      footerVisibilityService,
      platformId: 'server',
    });

    expect(screen.getByText('draft.loading')).toBeInTheDocument();
    expect(screen.queryByText('draft.apiUnavailable')).not.toBeInTheDocument();
    expect(fixture.componentInstance.loading).toBe(true);
    expect(fixture.componentInstance.apiError).toBe(false);
    expect(getOpeningDrafts).not.toHaveBeenCalled();
    expect(footerVisibilityService.markReady).toHaveBeenCalledWith(7);
  });
});
