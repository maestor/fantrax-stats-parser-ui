export const DRAFT_FOCUS_TARGET_SELECTOR = '.draft-focus-target';
export const DRAFT_FOCUS_PAGE_STEP = 5;
export const DRAFT_LIST_SCROLL_CONTAINER_SELECTOR = '.draft-accordion-scroll-window';

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

export function scrollDraftElementToTop(
  element: HTMLElement | null | undefined,
  behavior: ScrollBehavior = 'smooth',
): boolean {
  if (!element) {
    return false;
  }

  const scrollContainer = element.closest<HTMLElement>(DRAFT_LIST_SCROLL_CONTAINER_SELECTOR);
  if (scrollContainer && typeof scrollContainer.scrollTo === 'function') {
    const containerRect = scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const nextTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top);

    scrollContainer.scrollTo({
      top: Math.max(nextTop, 0),
      behavior,
    });
    return true;
  }

  if (typeof element.scrollIntoView === 'function') {
    element.scrollIntoView({ block: 'start', inline: 'nearest', behavior });
  }

  return true;
}

export function getExpandedDraftHeaderForEscape(currentHeader: HTMLElement): HTMLElement | null {
  if (currentHeader.getAttribute('aria-expanded') === 'true') {
    return currentHeader;
  }

  const accordion = currentHeader.closest('mat-accordion');
  return accordion?.querySelector('.mat-expansion-panel-header[aria-expanded="true"]') as HTMLElement | null;
}

export function getDraftPanelHeaderByTeamId(panelRoot: ParentNode, teamId: string): HTMLElement | null {
  const escapedTeamId = teamId.replaceAll('"', '\\"');
  return panelRoot.querySelector<HTMLElement>(
    `[data-team-id="${escapedTeamId}"] .mat-expansion-panel-header`,
  );
}

export function scheduleDraftHeaderAlignment(
  header: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  const alignHeader = () => {
    if (header.getAttribute('aria-expanded') === 'true') {
      scrollDraftElementToTop(header, behavior);
    }
  };

  window.setTimeout(alignHeader, 0);
  window.setTimeout(alignHeader, 250);
}

export function scheduleDraftTeamHeaderAlignment(
  panelRoot: ParentNode | null | undefined,
  teamId: string,
  behavior: ScrollBehavior = 'auto',
): void {
  if (!panelRoot || !teamId) {
    return;
  }

  const alignHeader = () => {
    const header = getDraftPanelHeaderByTeamId(panelRoot, teamId);
    if (header?.getAttribute('aria-expanded') === 'true') {
      scrollDraftElementToTop(header, behavior);
    }
  };

  window.setTimeout(alignHeader, 0);
  window.setTimeout(alignHeader, 250);
}

export function handleDraftHeaderClick(header: HTMLElement | null | undefined): void {
  if (!header) {
    return;
  }

  scheduleDraftHeaderAlignment(header);
}

export function handleDraftHeaderKeydown(
  event: KeyboardEvent,
  header: HTMLElement | null | undefined,
): void {
  if (!header) {
    return;
  }

  if (event.key === 'Escape') {
    const expandedHeader = getExpandedDraftHeaderForEscape(header);
    if (!expandedHeader) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    expandedHeader.click();
    window.setTimeout(() => header.focus({ preventScroll: true }), 0);
    return;
  }

  if ((event.key === 'Enter' || event.key === ' ') && header.getAttribute('aria-expanded') !== 'true') {
    scheduleDraftHeaderAlignment(header);
    return;
  }

  if (event.key !== 'ArrowDown') {
    return;
  }

  if (header.getAttribute('aria-expanded') !== 'true') {
    return;
  }

  const panel = header.closest('mat-expansion-panel');
  if (!panel) {
    return;
  }

  const [firstTarget] = getDraftFocusTargets(panel);
  if (!firstTarget) {
    return;
  }

  event.preventDefault();
  focusDraftElement(firstTarget);
}

export function handleDraftFocusTargetKeydown(
  event: KeyboardEvent,
  target: HTMLElement | null | undefined,
): void {
  if (!target) {
    return;
  }

  const panelElement = target.closest('mat-expansion-panel');
  if (!panelElement) {
    return;
  }

  const focusTargets = getDraftFocusTargets(panelElement);
  const currentIndex = focusTargets.indexOf(target);
  if (currentIndex === -1) {
    return;
  }

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      event.stopPropagation();
      focusDraftElement(focusTargets[Math.min(currentIndex + 1, focusTargets.length - 1)] ?? null);
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      event.stopPropagation();
      if (currentIndex === 0) {
        focusDraftElement(getDraftPanelHeader(panelElement));
        return;
      }

      focusDraftElement(focusTargets[currentIndex - 1] ?? null);
      break;
    }
    case 'Home': {
      event.preventDefault();
      event.stopPropagation();
      focusDraftElement(focusTargets[0] ?? null);
      break;
    }
    case 'End': {
      event.preventDefault();
      event.stopPropagation();
      focusDraftElement(focusTargets[focusTargets.length - 1] ?? null);
      break;
    }
    case 'PageDown': {
      event.preventDefault();
      event.stopPropagation();
      focusDraftElement(
        focusTargets[Math.min(currentIndex + DRAFT_FOCUS_PAGE_STEP, focusTargets.length - 1)] ?? null,
      );
      break;
    }
    case 'PageUp': {
      event.preventDefault();
      event.stopPropagation();
      focusDraftElement(
        focusTargets[Math.max(currentIndex - DRAFT_FOCUS_PAGE_STEP, 0)] ?? null,
      );
      break;
    }
    case 'Escape': {
      event.preventDefault();
      event.stopPropagation();
      const header = getDraftPanelHeader(panelElement);
      focusDraftElement(header);
      header?.click();
      break;
    }
  }
}
