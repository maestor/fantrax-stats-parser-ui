import {
  focusDraftElement,
  getDraftFocusTargets,
  getDraftPanelHeader,
  scrollDraftElementToTop,
} from './draft-keyboard-navigation.utils';

describe('draft keyboard navigation utils', () => {
  it('finds visible targets and handles missing elements safely', () => {
    const panel = document.createElement('section');
    panel.innerHTML = `
      <button class="mat-expansion-panel-header">Header</button>
      <div class="draft-focus-target" tabindex="-1">Visible target</div>
      <div inert>
        <div class="draft-focus-target" tabindex="-1">Hidden target</div>
      </div>
    `;

    expect(getDraftPanelHeader(panel)?.textContent).toBe('Header');

    const focusTargets = getDraftFocusTargets(panel);
    expect(focusTargets).toHaveLength(1);
    expect(focusTargets[0]?.textContent).toBe('Visible target');

    expect(focusDraftElement(null)).toBe(false);
    expect(scrollDraftElementToTop(null)).toBe(false);

    const target = focusTargets[0] as HTMLElement;
    const focusSpy = vi.spyOn(target, 'focus');
    Object.defineProperty(target, 'scrollIntoView', {
      configurable: true,
      value: undefined,
    });

    expect(focusDraftElement(target)).toBe(true);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollDraftElementToTop(target)).toBe(true);
  });
});
