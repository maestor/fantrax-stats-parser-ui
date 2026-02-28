import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ComparisonBarComponent } from './comparison-bar.component';
import { ComparisonService } from '@services/comparison.service';
import { Player } from '@services/api.service';

const mockPlayerA: Player = {
    name: 'Mikko Rantanen', position: 'F', score: 94.31, scoreAdjustedByGames: 93.1,
    games: 427, goals: 193, assists: 254, points: 447, plusMinus: 0,
    penalties: 256, shots: 1182, ppp: 165, shp: 0, hits: 276, blocks: 41,
};

const mockPlayerB: Player = {
    name: 'Aaron Ekblad', position: 'D', score: 100, scoreAdjustedByGames: 67.22,
    games: 540, goals: 100, assists: 188, points: 288, plusMinus: 40,
    penalties: 355, shots: 1413, ppp: 94, shp: 6, hits: 582, blocks: 574,
};

describe('ComparisonBarComponent', () => {
    let comparisonService: ComparisonService;
    let translateService: TranslateService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ComparisonBarComponent, TranslateModule.forRoot()],
        }).compileComponents();

        comparisonService = TestBed.inject(ComparisonService);
        translateService = TestBed.inject(TranslateService);

        translateService.setTranslation('fi', {
            comparison: {
                selectedOne: '{{name}} valittu \u2014 valitse toinen vertailuun',
                compare: 'Vertaile',
                clear: 'Tyhjenn\u00e4',
            },
        });
        translateService.use('fi');

        // Ensure clean state
        comparisonService.clear();
    });

    it('should not be visible when no players are selected', () => {
        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();


        const el: HTMLElement = fixture.nativeElement;
        const bar = el.querySelector('.comparison-bar');
        expect(bar).toBeNull();
    });

    it('should be visible when one player is selected', () => {
        comparisonService.toggle(mockPlayerA);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const bar = el.querySelector('.comparison-bar');
        expect(bar).toBeTruthy();
    });

    it('should show prompt text when one player is selected', () => {
        comparisonService.toggle(mockPlayerA);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const barText = el.querySelector('.bar-text')?.textContent?.trim() ?? '';
        expect(barText).toContain('Mikko Rantanen');
        expect(barText).toContain('valitse toinen vertailuun');
    });

    it('should show compare button when two players are selected', () => {
        comparisonService.toggle(mockPlayerA);
        comparisonService.toggle(mockPlayerB);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const buttons = Array.from(el.querySelectorAll('button'));
        const compareButton = buttons.find((b) => b.textContent?.trim() === 'Vertaile');
        expect(compareButton).toBeTruthy();
    });

    it('should not show compare button when only one player is selected', () => {
        comparisonService.toggle(mockPlayerA);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const buttons = Array.from(el.querySelectorAll('button'));
        const compareButton = buttons.find((b) => b.textContent?.trim() === 'Vertaile');
        expect(compareButton).toBeFalsy();
    });

    it('should call comparisonService.clear() when clear button is clicked', () => {
        comparisonService.toggle(mockPlayerA);
        vi.spyOn(comparisonService, 'clear');

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const buttons = Array.from(el.querySelectorAll('button'));
        const clearButton = buttons.find((b) => b.textContent?.trim() === 'Tyhjenn\u00e4');
        expect(clearButton).toBeTruthy();

        clearButton!.click();
        expect(comparisonService.clear).toHaveBeenCalled();
    });

    it('should call onCompare when compare button is clicked', () => {
        comparisonService.toggle(mockPlayerA);
        comparisonService.toggle(mockPlayerB);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        vi.spyOn(fixture.componentInstance, 'onCompare');

        const el: HTMLElement = fixture.nativeElement;
        const buttons = Array.from(el.querySelectorAll('button'));
        const compareButton = buttons.find((b) => b.textContent?.trim() === 'Vertaile');
        expect(compareButton).toBeTruthy();

        compareButton!.click();
        expect(fixture.componentInstance.onCompare).toHaveBeenCalled();
    });

    it('should open comparison dialog when onCompare is called with two players', () => {
        comparisonService.toggle(mockPlayerA);
        comparisonService.toggle(mockPlayerB);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const dialog = TestBed.inject(MatDialog);
        vi.spyOn(dialog, 'open');

        fixture.componentInstance.onCompare();


        expect(dialog.open).toHaveBeenCalled();
    });

    it('should not open dialog when onCompare is called with fewer than two players', () => {
        comparisonService.toggle(mockPlayerA);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const dialog = TestBed.inject(MatDialog);
        vi.spyOn(dialog, 'open');

        fixture.componentInstance.onCompare();


        expect(dialog.open).not.toHaveBeenCalled();
    });

    it('should show both player names when two players are selected', () => {
        comparisonService.toggle(mockPlayerA);
        comparisonService.toggle(mockPlayerB);

        const fixture = TestBed.createComponent(ComparisonBarComponent);
        fixture.detectChanges();

        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const barText = el.querySelector('.bar-text')?.textContent?.trim() ?? '';
        expect(barText).toContain('Mikko Rantanen');
        expect(barText).toContain('Aaron Ekblad');
    });

    describe('context change', () => {
        it('should clear comparison when context changes from player to goalie', () => {
            comparisonService.toggle(mockPlayerA);
            comparisonService.toggle(mockPlayerB);

            const fixture = TestBed.createComponent(ComparisonBarComponent);
            fixture.componentInstance.context = 'player';
            fixture.detectChanges();


            vi.spyOn(comparisonService, 'clear');

            // Change context from player to goalie
            fixture.componentInstance.context = 'goalie';
            fixture.componentInstance.ngOnChanges({
                context: {
                    currentValue: 'goalie',
                    previousValue: 'player',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            });

            expect(comparisonService.clear).toHaveBeenCalled();
        });

        it('should clear comparison when context changes from goalie to player', () => {
            comparisonService.toggle(mockPlayerA);

            const fixture = TestBed.createComponent(ComparisonBarComponent);
            fixture.componentInstance.context = 'goalie';
            fixture.detectChanges();


            vi.spyOn(comparisonService, 'clear');

            // Change context from goalie to player
            fixture.componentInstance.context = 'player';
            fixture.componentInstance.ngOnChanges({
                context: {
                    currentValue: 'player',
                    previousValue: 'goalie',
                    firstChange: false,
                    isFirstChange: () => false,
                },
            });

            expect(comparisonService.clear).toHaveBeenCalled();
        });

        it('should not clear comparison on initial context set (firstChange)', () => {
            comparisonService.toggle(mockPlayerA);

            vi.spyOn(comparisonService, 'clear');

            const fixture = TestBed.createComponent(ComparisonBarComponent);
            fixture.componentInstance.context = 'player';

            // Simulate initial change
            fixture.componentInstance.ngOnChanges({
                context: {
                    currentValue: 'player',
                    previousValue: undefined,
                    firstChange: true,
                    isFirstChange: () => true,
                },
            });

            fixture.detectChanges();


            expect(comparisonService.clear).not.toHaveBeenCalled();
        });
    });
});
