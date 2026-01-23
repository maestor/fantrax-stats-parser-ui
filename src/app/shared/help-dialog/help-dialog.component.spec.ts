import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpDialogComponent, HelpDialogModel } from './help-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('HelpDialogComponent', () => {
  let component: HelpDialogComponent;
  let fixture: ComponentFixture<HelpDialogComponent>;
  let translate: TranslateService;
  let dialogRef: { close: jasmine.Spy };

  beforeEach(async () => {
    dialogRef = { close: jasmine.createSpy('close') };

    await TestBed.configureTestingModule({
      imports: [HelpDialogComponent, TranslateModule.forRoot()],
      providers: [{ provide: MatDialogRef, useValue: dialogRef }],
    }).compileComponents();

    translate = TestBed.inject(TranslateService);

    fixture = TestBed.createComponent(HelpDialogComponent);
    component = fixture.componentInstance;
  });

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

    spyOn(translate, 'get').and.returnValue(of(model));

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
});
