export const DRAFT_FOCUS_TARGET_SELECTOR = '.draft-focus-target';
export const DRAFT_FOCUS_PAGE_STEP = 5;

export function getDraftPanelHeader(panel: ParentNode): HTMLElement | null {
  return panel.querySelector<HTMLElement>('.mat-expansion-panel-header');
}

export function getDraftFocusTargets(panel: ParentNode): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(DRAFT_FOCUS_TARGET_SELECTOR))
    .filter((element) => !element.closest('[inert]'));
}

export function focusDraftElement(element: HTMLElement | null | undefined): boolean {
  if (!element) {
    return false;
  }

  element.focus({ preventScroll: true });

  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  return true;
}

export function scrollDraftElementToTop(element: HTMLElement | null | undefined): boolean {
  if (!element) {
    return false;
  }

  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'smooth' });
  }

  return true;
}
