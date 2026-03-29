import { provideRouter } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { fireEvent, render, screen } from '@testing-library/angular';
import { TranslateModule } from '@ngx-translate/core';

import { provideDisabledMaterialAnimations, polyfillJsdom } from '../../testing/behavior-test-utils';
import { GlobalNavComponent } from './global-nav.component';

describe('GlobalNavComponent — keyboard navigation', () => {
  beforeEach(() => {
    polyfillJsdom();
  });

  it('supports wrapped vertical arrow navigation across nav items', async () => {
    await render(GlobalNavComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        provideRouter([]),
        { provide: MatBottomSheetRef, useValue: { dismiss: vi.fn() } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    });

    const [
      hockeyButton,
      careersButton,
      draftsButton,
      leaderboardsButton,
      infoButton,
    ] = await screen.findAllByRole('button');

    await vi.waitFor(() => {
      expect(hockeyButton).toHaveFocus();
    });

    fireEvent.keyDown(hockeyButton, { key: 'ArrowUp' });
    expect(infoButton).toHaveFocus();

    fireEvent.keyDown(infoButton, { key: 'ArrowDown' });
    expect(hockeyButton).toHaveFocus();

    fireEvent.keyDown(hockeyButton, { key: 'ArrowDown' });
    expect(careersButton).toHaveFocus();

    fireEvent.keyDown(careersButton, { key: 'ArrowDown' });
    expect(draftsButton).toHaveFocus();

    fireEvent.keyDown(draftsButton, { key: 'ArrowDown' });
    expect(leaderboardsButton).toHaveFocus();

    fireEvent.keyDown(leaderboardsButton, { key: 'ArrowDown' });
    expect(infoButton).toHaveFocus();
  });

  it('supports Home and End while preserving native activation keys', async () => {
    const dialogOpen = vi.fn();

    await render(GlobalNavComponent, {
      imports: [TranslateModule.forRoot()],
      providers: [
        provideDisabledMaterialAnimations(),
        provideRouter([]),
        { provide: MatBottomSheetRef, useValue: { dismiss: vi.fn() } },
        { provide: MatDialog, useValue: { open: dialogOpen } },
      ],
    });

    const buttons = await screen.findAllByRole('button');
    const hockeyButton = buttons[0] as HTMLElement;
    const careersButton = buttons[1] as HTMLElement;
    const infoButton = buttons.at(-1) as HTMLElement;

    careersButton.focus();
    fireEvent.keyDown(careersButton, { key: 'End' });
    expect(infoButton).toHaveFocus();

    fireEvent.keyDown(infoButton, { key: 'Home' });
    expect(hockeyButton).toHaveFocus();

    fireEvent.keyDown(infoButton, { key: 'Enter' });
    expect(dialogOpen).not.toHaveBeenCalled();
  });
});
