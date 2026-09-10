import { Directive, ElementRef, inject } from '@angular/core';

import {
  handleDraftFocusTargetKeydown,
  handleDraftHeaderClick,
  handleDraftHeaderKeydown,
} from './draft-keyboard-navigation.utils';

@Directive({
  selector: 'mat-expansion-panel-header[draftPanelHeaderNavigation]',
  host: { '(click)': 'onClick()', '(keydown)': 'onKeydown($event)' },
})
export class DraftPanelHeaderNavigationDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  onClick(): void {
    handleDraftHeaderClick(this.elementRef.nativeElement);
  }

  onKeydown(event: KeyboardEvent): void {
    handleDraftHeaderKeydown(event, this.elementRef.nativeElement);
  }
}

@Directive({
  selector: '[draftPanelFocusTarget]',
  host: { '(keydown)': 'onKeydown($event)' },
})
export class DraftPanelFocusTargetDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  onKeydown(event: KeyboardEvent): void {
    handleDraftFocusTargetKeydown(event, this.elementRef.nativeElement);
  }
}
