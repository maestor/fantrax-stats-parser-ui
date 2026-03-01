import { ComponentFixture, TestBed, } from "@angular/core/testing";
import { TeamSwitcherComponent } from "./team-switcher.component";
import { ApiService, Team } from "@services/api.service";
import { FilterService } from "@services/filter.service";
import { TeamService } from "@services/team.service";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { BehaviorSubject, of, throwError } from "rxjs";
import { Router } from "@angular/router";
import { MatSelectChange } from "@angular/material/select";

class TeamServiceMock {
    private selectedTeamIdSubject = new BehaviorSubject<string>("1");
    selectedTeamId$ = this.selectedTeamIdSubject.asObservable();

    get selectedTeamId(): string {
        return this.selectedTeamIdSubject.value;
    }

    setTeamId(teamId: string): void {
        this.selectedTeamIdSubject.next(teamId);
    }
}

describe("TeamSwitcherComponent", () => {
    let component: TeamSwitcherComponent;
    let fixture: ComponentFixture<TeamSwitcherComponent>;
    let apiService: any;
    let filterService: any;
    let router: any;
    let translate: TranslateService;

    const mockTeams: Team[] = [
        { id: "2", name: "carolina", presentName: "Carolina Hurricanes" },
        { id: "1", name: "colorado", presentName: "Colorado Avalanche" },
    ];

    beforeEach(async () => {
        apiService = {
            getTeams: vi.fn().mockName("ApiService.getTeams")
        } as any;
        filterService = {
            resetAll: vi.fn().mockName("FilterService.resetAll")
        } as any;
        router = {
            navigate: vi.fn().mockName("Router.navigate")
        } as any;

        await TestBed.configureTestingModule({
            imports: [
                TeamSwitcherComponent,
                TranslateModule.forRoot(),
                NoopAnimationsModule,
            ],
            providers: [
                { provide: ApiService, useValue: apiService },
                { provide: FilterService, useValue: filterService },
                { provide: TeamService, useClass: TeamServiceMock },
                { provide: Router, useValue: router },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TeamSwitcherComponent);
        component = fixture.componentInstance;

        translate = TestBed.inject(TranslateService);
        translate.use("fi");
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should load teams on init", () => {
        apiService.getTeams.mockReturnValue(of(mockTeams));

        component.ngOnInit();


        expect(apiService.getTeams).toHaveBeenCalled();
        expect(component.loading).toBe(false);
        expect(component.loadError).toBe(false);
        expect(component.teams.length).toBe(2);
    });

    it("should sort teams alphabetically by presentName", () => {
        apiService.getTeams.mockReturnValue(of(mockTeams));

        component.ngOnInit();


        expect(component.teams.map((t) => t.name)).toEqual([
            "carolina",
            "colorado",
        ]);
    });

    it("should set loadError on API failure", () => {
        apiService.getTeams.mockReturnValue(throwError(() => new Error("backend unavailable")));

        component.ngOnInit();


        expect(component.loading).toBe(false);
        expect(component.loadError).toBe(true);
        expect(component.teams).toEqual([]);
    });

    it("should reset filters and navigate on team change", () => {
        apiService.getTeams.mockReturnValue(of(mockTeams));
        component.ngOnInit();


        const event = { value: "2" } as MatSelectChange;
        component.changeTeam(event);


        expect(component.selectedTeamId).toBe("2");
        expect(filterService.resetAll).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(["/player-stats"]);
    });

    it("should no-op when teamId is falsy", () => {
        apiService.getTeams.mockReturnValue(of(mockTeams));
        component.ngOnInit();


        const teamService = TestBed.inject(TeamService) as unknown as TeamServiceMock;
        const setTeamSpy = vi.spyOn(teamService, "setTeamId");

        const event = { value: "" } as unknown as MatSelectChange;
        component.changeTeam(event);


        expect(setTeamSpy).not.toHaveBeenCalled();
        expect(filterService.resetAll).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
