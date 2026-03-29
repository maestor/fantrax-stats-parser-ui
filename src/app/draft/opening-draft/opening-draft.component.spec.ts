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

  function stubScrollIntoView() {
    const original = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();

    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    return {
      scrollIntoView,
      restore: () => {
        if (original) {
          Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: original,
          });
          return;
        }

        delete (HTMLElement.prototype as Partial<typeof HTMLElement.prototype>).scrollIntoView;
      },
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

  it('moves focus from an expanded header into opening draft picks with keyboard navigation', async () => {
    const { container } = await renderComponent();

    const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    fireEvent.click(header);

    const firstPanel = container.querySelector('mat-expansion-panel');
    expect(firstPanel).not.toBeNull();

    const pickRows = Array.from((firstPanel as HTMLElement).querySelectorAll<HTMLElement>('.draft-pick-item'));
    expect(pickRows.length).toBeGreaterThan(1);

    const [firstPick, secondPick] = pickRows;
    const lastPick = pickRows.at(-1);

    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick, { key: 'ArrowDown' });
    expect(secondPick).toHaveFocus();

    fireEvent.keyDown(secondPick, { key: 'Home' });
    expect(firstPick).toHaveFocus();

    if (lastPick) {
      fireEvent.keyDown(firstPick, { key: 'End' });
      expect(lastPick).toHaveFocus();

      fireEvent.keyDown(lastPick, { key: 'Escape' });
      expect(header).toHaveFocus();
      expect(header).toHaveAttribute('aria-expanded', 'false');
    }
  });

  it('supports paging within opening draft picks and collapsing from the expanded header', async () => {
    const { container, fixture } = await renderComponent();

    const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    fireEvent.click(header);

    const firstPanel = container.querySelector('mat-expansion-panel');
    expect(firstPanel).not.toBeNull();

    const pickRows = Array.from((firstPanel as HTMLElement).querySelectorAll<HTMLElement>('.draft-pick-item'));
    expect(pickRows.length).toBeGreaterThan(1);

    const [firstPick] = pickRows;
    const lastPick = pickRows.at(-1);
    expect(firstPick).toBeDefined();
    expect(lastPick).toBeDefined();

    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick as HTMLElement, { key: 'PageDown' });
    expect(lastPick).toHaveFocus();

    fireEvent.keyDown(lastPick as HTMLElement, { key: 'PageUp' });
    expect(firstPick).toHaveFocus();

    fireEvent.keyDown(firstPick as HTMLElement, { key: 'ArrowUp' });
    expect(header).toHaveFocus();

    fireEvent.keyDown(header, { key: 'Escape' });

    await waitForBehaviorAssertion(fixture, () => {
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(header).toHaveFocus();
    });
  });

  it('covers collapsed-header and guard keyboard paths without scrolling', async () => {
    const { fixture } = await renderComponent();
    const component = fixture.componentInstance;
    const header = await screen.findByRole('button', { name: 'Dallas Stars' });
    const { scrollIntoView, restore } = stubScrollIntoView();
    vi.useFakeTimers();

    try {
      component.onHeaderKeydown({
        key: 'Enter',
        currentTarget: header,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);
      vi.runAllTimers();
      expect(scrollIntoView).not.toHaveBeenCalled();

      const collapsedEscapeEvent = {
        key: 'Escape',
        currentTarget: header,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent;
      component.onHeaderKeydown(collapsedEscapeEvent);
      expect(collapsedEscapeEvent.preventDefault).not.toHaveBeenCalled();

      component.onHeaderKeydown({ key: 'Escape', currentTarget: null } as unknown as KeyboardEvent);

      component.onHeaderKeydown({
        key: 'ArrowDown',
        currentTarget: header,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);

      const orphanHeader = document.createElement('button');
      orphanHeader.setAttribute('aria-expanded', 'true');
      component.onHeaderKeydown({
        key: 'ArrowDown',
        currentTarget: orphanHeader,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);

      component.onPickKeydown(
        { key: 'ArrowDown', currentTarget: null } as unknown as KeyboardEvent,
        { close: vi.fn() } as never,
      );

      const orphanTarget = document.createElement('div');
      component.onPickKeydown(
        {
          key: 'ArrowDown',
          currentTarget: orphanTarget,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent,
        { close: vi.fn() } as never,
      );

      const panelElement = document.createElement('mat-expansion-panel');
      const nonFocusTarget = document.createElement('div');
      panelElement.appendChild(nonFocusTarget);
      component.onPickKeydown(
        {
          key: 'ArrowDown',
          currentTarget: nonFocusTarget,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent,
        { close: vi.fn() } as never,
      );
    } finally {
      vi.useRealTimers();
      restore();
    }
  });

  it('scrolls an expanded opening-draft header to the top without moving focus into picks', async () => {
    const { scrollIntoView, restore } = stubScrollIntoView();

    try {
      const { fixture } = await renderComponent();

      const header = await screen.findByRole('button', { name: 'Colorado Avalanche' });
      fireEvent.click(header);

      await waitForBehaviorAssertion(fixture, () => {
        expect(scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
        expect(header).toHaveAttribute('aria-expanded', 'true');
      });
    } finally {
      restore();
    }
  });

  it('lets Escape on a header collapse whichever opening-draft panel is currently expanded', async () => {
    const { fixture } = await renderComponent();

    const coloradoHeader = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    const dallasHeader = await screen.findByRole('button', { name: 'Dallas Stars' });

    fireEvent.click(coloradoHeader);
    expect(coloradoHeader).toHaveAttribute('aria-expanded', 'true');

    dallasHeader.focus();
    fireEvent.keyDown(dallasHeader, { key: 'Escape' });

    await waitForBehaviorAssertion(fixture, () => {
      expect(coloradoHeader).toHaveAttribute('aria-expanded', 'false');
      expect(dallasHeader).toHaveFocus();
    });
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

  it('keeps only one opening-draft panel expanded at a time', async () => {
    await renderComponent();

    const firstPanelButton = await screen.findByRole('button', { name: 'Colorado Avalanche' });
    const secondPanelButton = await screen.findByRole('button', { name: 'Dallas Stars' });

    fireEvent.click(firstPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'true');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(secondPanelButton);
    expect(firstPanelButton).toHaveAttribute('aria-expanded', 'false');
    expect(secondPanelButton).toHaveAttribute('aria-expanded', 'true');
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
