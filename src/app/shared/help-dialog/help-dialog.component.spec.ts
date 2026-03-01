import type { Mock } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpDialogComponent, HelpDialogModel } from './help-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('HelpDialogComponent', () => {
    let component: HelpDialogComponent;
    let fixture: ComponentFixture<HelpDialogComponent>;
    let translate: TranslateService;
    let dialogRef: {
        close: Mock;
    };

    beforeEach(async () => {
        dialogRef = { close: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [HelpDialogComponent, TranslateModule.forRoot()],
            providers: [{ provide: MatDialogRef, useValue: dialogRef }],
        }).compileComponents();

        translate = TestBed.inject(TranslateService);

        fixture = TestBed.createComponent(HelpDialogComponent);
        component = fixture.componentInstance;
    });

    const mockHelpDialogTranslation = (model: HelpDialogModel): void => {
        vi.spyOn(translate, 'get').mockImplementation((key: string | string[]) => {
            if (key === 'helpDialog') {
                return of(model);
            }

            return of(key);
        });
    };

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load and render blocks', () => {
        const model: HelpDialogModel = {
            title: 'Ohje',
            blocks: [
                { type: 'h2', text: 'Otsikko' },
                { type: 'h3', text: 'Alaotsikko' },
                { type: 'p', text: 'Intro' },
                { type: 'ul', items: ['A', 'B'] },
            ],
        };

        mockHelpDialogTranslation(model);

        fixture.detectChanges();

        const title = fixture.nativeElement.querySelector('.help-title');
        expect(title.textContent).toContain('Ohje');

        const items = fixture.nativeElement.querySelectorAll('li');
        expect(items.length).toBe(2);

        const h2 = fixture.nativeElement.querySelector('.help-h2');
        expect(h2.textContent).toContain('Otsikko');

        const h3 = fixture.nativeElement.querySelector('.help-h3');
        expect(h3.textContent).toContain('Alaotsikko');
    });

    it('should close dialog', () => {
        component.close();
        expect(dialogRef.close).toHaveBeenCalled();
    });

    it('should render social links in dialog actions', () => {
        const model: HelpDialogModel = {
            title: 'Ohje',
            blocks: [{ type: 'p', text: 'Intro' }],
        };

        mockHelpDialogTranslation(model);

        fixture.detectChanges();

        const actionLinks = Array.from(fixture.nativeElement.querySelectorAll('.help-social-link')) as HTMLAnchorElement[];

        expect(actionLinks.length).toBe(3);
        expect(actionLinks.map((link) => link.getAttribute('href'))).toEqual([
            'footer.links.linkedin.href',
            'footer.links.ui.href',
            'footer.links.api.href',
        ]);
    });
});
