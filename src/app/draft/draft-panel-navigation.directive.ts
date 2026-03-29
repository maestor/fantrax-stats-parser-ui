import { Directive, ElementRef, HostListener, inject } from '@angular/core';

import {
  handleDraftFocusTargetKeydown,
  handleDraftHeaderClick,
  handleDraftHeaderKeydown,
} from './draft-keyboard-navigation.utils';

@Directive({
  selector: 'mat-expansion-panel-header[draftPanelHeaderNavigation]',
  standalone: true,
})
export class DraftPanelHeaderNavigationDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('click')
  onClick(): void {
    handleDraftHeaderClick(this.elementRef.nativeElement);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    handleDraftHeaderKeydown(event, this.elementRef.nativeElement);
  }
}

@Directive({
  selector: '[draftPanelFocusTarget]',
  standalone: true,
})
export class DraftPanelFocusTargetDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    handleDraftFocusTargetKeydown(event, this.elementRef.nativeElement);
  }
}
