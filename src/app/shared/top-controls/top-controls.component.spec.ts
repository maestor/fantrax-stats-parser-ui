import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { TopControlsComponent } from "./top-controls.component";

describe("TopControlsComponent", () => {
  let component: TopControlsComponent;
  let fixture: ComponentFixture<TopControlsComponent>;

  const clearSettingsStorage = (): void => {
    localStorage.removeItem("fantrax.settings");
  };

  beforeEach(async () => {
    clearSettingsStorage();

    await TestBed.configureTestingModule({
      imports: [TopControlsComponent, TranslateModule.forRoot()],
    })
      .overrideComponent(TopControlsComponent, {
        set: {
          // Keep the test shallow: custom elements are allowed via schema.
          imports: [TranslateModule],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation(
      "fi",
      {
        topControls: {
          controls: "Valinnat",
        },
      },
      true,
    );
    translate.use("fi");
  });

  afterEach(() => {
    try {
      clearSettingsStorage();
    } catch {
      // ignore
    }
  });

  it("should create", () => {
    clearSettingsStorage();
    fixture = TestBed.createComponent(TopControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should default to expanded when localStorage is empty", () => {
    clearSettingsStorage();
    fixture = TestBed.createComponent(TopControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isExpanded).toBe(true);
  });

  it("should restore collapsed state from localStorage", () => {
    localStorage.setItem(
      "fantrax.settings",
      JSON.stringify({
        selectedTeamId: "1",
        startFromSeason: null,
        topControlsExpanded: false,
        season: null,
        reportType: "regular",
      }),
    );

    fixture = TestBed.createComponent(TopControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isExpanded).toBe(false);
  });

  it("should persist toggle state to localStorage", () => {
    clearSettingsStorage();
    fixture = TestBed.createComponent(TopControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleExpanded();
    expect(
      JSON.parse(localStorage.getItem("fantrax.settings") ?? "{}")
        .topControlsExpanded,
    ).toBe(false);

    component.toggleExpanded();
    expect(
      JSON.parse(localStorage.getItem("fantrax.settings") ?? "{}")
        .topControlsExpanded,
    ).toBe(true);
  });

  it("should force expanded and disable toggling when contentOnly is true", () => {
    localStorage.setItem(
      "fantrax.settings",
      JSON.stringify({
        selectedTeamId: "1",
        startFromSeason: null,
        topControlsExpanded: false,
        season: null,
        reportType: "regular",
      }),
    );

    fixture = TestBed.createComponent(TopControlsComponent);
    component = fixture.componentInstance;
    component.contentOnly = true;
    fixture.detectChanges();

    expect(component.isExpanded).toBe(true);

    component.toggleExpanded();
    expect(
      JSON.parse(localStorage.getItem("fantrax.settings") ?? "{}")
        .topControlsExpanded,
    ).toBe(false);
  });
});
