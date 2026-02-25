import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalNavComponent } from './global-nav.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { HelpDialogComponent } from '@shared/help-dialog/help-dialog.component';

describe('GlobalNavComponent', () => {
  let component: GlobalNavComponent;
  let fixture: ComponentFixture<GlobalNavComponent>;
  let routerMock: { navigateByUrl: jasmine.Spy; url: string };
  let bottomSheetRef: { dismiss: jasmine.Spy };
  let dialog: { open: jasmine.Spy };

  @Component({ template: '' })
  class DummyComponent {}

  const setup = async (url = '/') => {
    routerMock = {
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.returnValue(Promise.resolve(true)),
      url,
    };
    bottomSheetRef = { dismiss: jasmine.createSpy('dismiss') };
    dialog = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [GlobalNavComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([{ path: '**', component: DummyComponent }]),
      ],
    })
      .overrideProvider(Router, { useValue: routerMock })
      .overrideProvider(MatBottomSheetRef, { useValue: bottomSheetRef })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(GlobalNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('navItems', () => {
    it('should have exactly 3 items', async () => {
      await setup();
      expect(component.navItems.length).toBe(3);
    });

    it('should define info item as action type with correct icon and label key', async () => {
      await setup();
      const item = component.navItems.find((i) => i.type === 'action');
      expect(item).toBeTruthy();
      expect(item?.icon).toBe('info');
      expect(item?.labelKey).toBe('nav.info');
    });

    it('should define leaderboards item as route type with correct props', async () => {
      await setup();
      const item = component.navItems.find((i) => i.path === '/leaderboards');
      expect(item).toBeTruthy();
      expect(item?.icon).toBe('emoji_events');
      expect(item?.labelKey).toBe('nav.leaderboards');
      expect(item?.type).toBe('route');
    });

    it('should define hockey stats item as route type with correct props', async () => {
      await setup();
      const item = component.navItems.find((i) => i.path === '/');
      expect(item).toBeTruthy();
      expect(item?.icon).toBe('sports_hockey');
      expect(item?.labelKey).toBe('nav.hockeyPlayerStats');
      expect(item?.type).toBe('route');
    });
  });

  describe('isActive', () => {
    it('should return false for info action item regardless of url', async () => {
      await setup('/');
      const item = component.navItems.find((i) => i.type === 'action')!;
      expect(component.isActive(item)).toBeFalse();
    });

    it('should return true for hockey stats item when url is /', async () => {
      await setup('/');
      const item = component.navItems.find((i) => i.path === '/')!;
      expect(component.isActive(item)).toBeTrue();
    });

    it('should return true for hockey stats item when url starts with /player-stats', async () => {
      await setup('/player-stats');
      const item = component.navItems.find((i) => i.path === '/')!;
      expect(component.isActive(item)).toBeTrue();
    });

    it('should return true for hockey stats item when url starts with /goalie-stats', async () => {
      await setup('/goalie-stats');
      const item = component.navItems.find((i) => i.path === '/')!;
      expect(component.isActive(item)).toBeTrue();
    });

    it('should return false for hockey stats item when on leaderboards route', async () => {
      await setup('/leaderboards/regular');
      const item = component.navItems.find((i) => i.path === '/')!;
      expect(component.isActive(item)).toBeFalse();
    });

    it('should return true for leaderboards item when url starts with /leaderboards', async () => {
      await setup('/leaderboards/regular');
      const item = component.navItems.find((i) => i.path === '/leaderboards')!;
      expect(component.isActive(item)).toBeTrue();
    });

    it('should return true for leaderboards item when url is /leaderboards/playoffs', async () => {
      await setup('/leaderboards/playoffs');
      const item = component.navItems.find((i) => i.path === '/leaderboards')!;
      expect(component.isActive(item)).toBeTrue();
    });

    it('should return false for leaderboards item when on hockey stats route', async () => {
      await setup('/player-stats');
      const item = component.navItems.find((i) => i.path === '/leaderboards')!;
      expect(component.isActive(item)).toBeFalse();
    });
  });

  describe('onItemClick', () => {
    it('should navigate to / and dismiss sheet when hockey stats item clicked', async () => {
      await setup('/leaderboards/regular');
      const item = component.navItems.find((i) => i.path === '/')!;
      component.onItemClick(item);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });

    it('should navigate to /leaderboards and dismiss sheet when leaderboards item clicked', async () => {
      await setup('/');
      const item = component.navItems.find((i) => i.path === '/leaderboards')!;
      component.onItemClick(item);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/leaderboards');
      expect(bottomSheetRef.dismiss).toHaveBeenCalled();
    });

    it('should open HelpDialogComponent and NOT dismiss sheet when info item clicked', async () => {
      await setup('/');
      const item = component.navItems.find((i) => i.type === 'action')!;
      component.onItemClick(item);
      expect(dialog.open).toHaveBeenCalledWith(
        HelpDialogComponent,
        jasmine.objectContaining({ panelClass: 'help-dialog' }),
      );
      expect(bottomSheetRef.dismiss).not.toHaveBeenCalled();
    });
  });
});
