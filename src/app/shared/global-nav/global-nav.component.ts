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
    { icon: 'assignment_add', labelKey: 'nav.drafts', type: 'route', path: '/draft' },
    { icon: 'emoji_events', labelKey: 'nav.leaderboards', type: 'route', path: '/leaderboards' },
    { icon: 'info', labelKey: 'nav.info', type: 'action' },
  ];

  constructor() {
    afterNextRender(() => {
      const activeIndex = this.navItems.findIndex((item) => this.isActive(item));
      this.focusNavItem(activeIndex === -1 ? 0 : activeIndex);
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
    if (item.path === '/draft') {
      return url.startsWith('/draft');
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

  onItemKeydown(event: KeyboardEvent, index: number): void {
    const itemCount = this.navItems.length;
    if (itemCount === 0) {
      return;
    }

    let targetIndex: number | null = null;

    switch (event.key) {
      case 'ArrowDown':
        targetIndex = (index + 1) % itemCount;
        break;
      case 'ArrowUp':
        targetIndex = (index - 1 + itemCount) % itemCount;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = itemCount - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusNavItem(targetIndex);
  }

  private focusNavItem(index: number): void {
    const target = this.getNavItems()[index] ?? null;
    target?.focus({ focusVisible: true } as FocusOptions);
  }

  private getNavItems(): HTMLElement[] {
    const host = this.elementRef.nativeElement as HTMLElement;
    return Array.from(host.querySelectorAll('.global-nav-item'));
  }
}
