import { afterNextRender, Component, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

let helpDialogComponentPromise: Promise<
  typeof import('@shared/help-dialog/help-dialog.component')
> | null = null;

function loadHelpDialogComponent() {
  helpDialogComponentPromise ??= import('@shared/help-dialog/help-dialog.component');
  return helpDialogComponentPromise;
}

type NavItemType = 'route' | 'action';

interface NavItem {
  icon: string;
  labelKey: string;
  type: NavItemType;
  path?: string;
}

@Component({
  selector: 'app-global-nav',
  imports: [MatListModule, MatIconModule, TranslateModule],
  templateUrl: './global-nav.component.html',
  styleUrl: './global-nav.component.scss',
})
export class GlobalNavComponent {
  private readonly router = inject(Router);
  private readonly bottomSheetRef = inject(MatBottomSheetRef<GlobalNavComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly elementRef = inject(ElementRef);

  readonly navItems: NavItem[] = [
    { icon: 'score', labelKey: 'nav.hockeyPlayerStats', type: 'route', path: '/' },
    { icon: 'assignment_ind', labelKey: 'nav.playerCareers', type: 'route', path: '/career' },
    { icon: 'emoji_events', labelKey: 'nav.leaderboards', type: 'route', path: '/leaderboards' },
    { icon: 'info', labelKey: 'nav.info', type: 'action' },
  ];

  constructor() {
    afterNextRender(() => {
      const el = this.elementRef.nativeElement;
      const target = (el.querySelector('.global-nav-item--active') ?? el.querySelector('.global-nav-item')) as HTMLElement | null;
      target?.focus({ focusVisible: true } as FocusOptions);
    });
  }

  isActive(item: NavItem): boolean {
    if (item.type === 'action') return false;
    const url = this.router.url;
    if (item.path === '/') {
      return url === '/' || url.startsWith('/player-stats') || url.startsWith('/goalie-stats');
    }
    if (item.path === '/career') {
      return url.startsWith('/career');
    }
    return !!item.path && url.startsWith(item.path);
  }

  async onItemClick(item: NavItem): Promise<void> {
    if (item.type === 'route' && item.path) {
      void this.router.navigateByUrl(item.path);
      this.bottomSheetRef.dismiss();
    } else if (item.type === 'action') {
      const { HelpDialogComponent } = await loadHelpDialogComponent();
      this.dialog.open(HelpDialogComponent, {
        panelClass: 'help-dialog',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      });
      // Sheet stays open — user can continue navigating after closing the dialog
    }
  }
}
