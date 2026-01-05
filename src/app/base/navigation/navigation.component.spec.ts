import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationComponent } from './navigation.component';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatTabsModule, MatTabNavPanel } from '@angular/material/tabs';
import { ChangeDetectorRef } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;
  let router: Router;
  let cdr: ChangeDetectorRef;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [NavigationComponent, TranslateModule.forRoot(), MatTabsModule],
      providers: [
        provideRouter([
          { path: 'player-stats', component: NavigationComponent },
          { path: 'goalie-stats', component: NavigationComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    cdr = fixture.componentRef.injector.get(ChangeDetectorRef);

    const mockTabPanel = {} as MatTabNavPanel;
    component.tabPanel = mockTabPanel;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should have navigation items defined', () => {
      expect(component.navItems).toBeDefined();
      expect(component.navItems.length).toBe(2);
    });

    it('should have correct navigation item structure', () => {
      expect(component.navItems[0]).toEqual({
        label: 'link.playerStats',
        path: '/player-stats',
      });
      expect(component.navItems[1]).toEqual({
        label: 'link.goalieStats',
        path: '/goalie-stats',
      });
    });

    it('should initialize activeLink as empty string', () => {
      expect(component.activeLink).toBe('');
    });

    it('should subscribe to router events on init', () => {
      spyOn(router.events, 'subscribe');
      component.ngOnInit();
      expect(router.events.subscribe).toHaveBeenCalled();
    });
  });

  describe('router integration', () => {
    it('should update activeLink when router URL changes', (done) => {
      component.ngOnInit();
      router.navigate(['/player-stats']).then(() => {
        expect(component.activeLink).toBe('/player-stats');
        done();
      });
    });

    it('should update activeLink for goalie stats route', (done) => {
      component.ngOnInit();
      router.navigate(['/goalie-stats']).then(() => {
        expect(component.activeLink).toBe('/goalie-stats');
        done();
      });
    });

    it('should trigger change detection when router URL changes', (done) => {
      spyOn(cdr, 'detectChanges');
      component.ngOnInit();

      router.navigate(['/player-stats']).then(() => {
        expect(cdr.detectChanges).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('setActiveTab', () => {
    it('should set activeLink to provided path', () => {
      component.setActiveTab('/player-stats');
      expect(component.activeLink).toBe('/player-stats');
    });

    it('should update activeLink when called with different paths', () => {
      component.setActiveTab('/player-stats');
      expect(component.activeLink).toBe('/player-stats');

      component.setActiveTab('/goalie-stats');
      expect(component.activeLink).toBe('/goalie-stats');
    });

    it('should trigger change detection', () => {
      spyOn(cdr, 'detectChanges');
      component.setActiveTab('/player-stats');
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should handle multiple consecutive calls', () => {
      component.setActiveTab('/player-stats');
      component.setActiveTab('/goalie-stats');
      component.setActiveTab('/player-stats');
      expect(component.activeLink).toBe('/player-stats');
    });
  });

  describe('template rendering', () => {
    it('should render navigation links', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-tab-link]');
      expect(links.length).toBe(2);
    });

    it('should set correct routerLink for each navigation item', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const links = compiled.querySelectorAll('a[mat-tab-link]');

      expect(links[0].getAttribute('ng-reflect-router-link')).toBe(
        '/player-stats'
      );
      expect(links[1].getAttribute('ng-reflect-router-link')).toBe(
        '/goalie-stats'
      );
    });

    it('should activate link when clicked', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const link = compiled.querySelector(
        'a[mat-tab-link]'
      ) as HTMLAnchorElement;

      link.click();
      fixture.detectChanges();

      expect(component.activeLink).toBe('/player-stats');
    });
  });

  describe('edge cases', () => {
    it('should handle empty path in setActiveTab', () => {
      component.setActiveTab('');
      expect(component.activeLink).toBe('');
    });

    it('should handle arbitrary path in setActiveTab', () => {
      component.setActiveTab('/unknown-route');
      expect(component.activeLink).toBe('/unknown-route');
    });
  });
});
