import { afterEach, describe, expect, it, vi } from 'vitest';

import { getChartSeriesColors, resolveThemedCssColorVar } from './chart-theme.utils';

describe('chart theme utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('style');
    document.body.removeAttribute('style');
  });

  it('reads the configured chart token colors for a series', () => {
    document.documentElement.style.setProperty('--app-chart-series-1', 'rgb(10, 20, 30)');
    document.documentElement.style.setProperty(
      '--app-chart-series-1-fill',
      'rgba(10, 20, 30, 0.25)',
    );
    document.documentElement.style.setProperty('--mat-sys-surface', 'rgb(240, 241, 242)');

    const colors = getChartSeriesColors(document, 0);

    expect(colors).toEqual({
      lineColor: 'rgb(10, 20, 30)',
      fillColor: 'rgba(10, 20, 30, 0.25)',
      pointBackgroundColor: 'rgb(10, 20, 30)',
      pointBorderColor: 'rgb(240, 241, 242)',
      pointHoverBackgroundColor: 'rgb(240, 241, 242)',
      pointHoverBorderColor: 'rgb(10, 20, 30)',
    });
  });

  it('wraps the palette index so longer line-chart selections still get shared theme colors', () => {
    document.documentElement.style.setProperty('--app-chart-series-1', 'rgb(10, 20, 30)');
    document.documentElement.style.setProperty(
      '--app-chart-series-1-fill',
      'rgba(10, 20, 30, 0.25)',
    );
    document.documentElement.style.setProperty('--mat-sys-surface', 'rgb(240, 241, 242)');

    const colors = getChartSeriesColors(document, 6);

    expect(colors.lineColor).toBe('rgb(10, 20, 30)');
    expect(colors.fillColor).toBe('rgba(10, 20, 30, 0.25)');
  });

  it('returns the fallback when the document has no body', () => {
    const fakeDocument = {
      body: undefined,
      documentElement: document.documentElement,
    } as unknown as Document;

    expect(resolveThemedCssColorVar(fakeDocument, '--missing-color', '#abc123')).toBe('#abc123');
  });

  it('falls back to the direct root token when the probe cannot resolve a var() value', () => {
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle');

    getComputedStyleSpy.mockImplementation((element: Element) => {
      if (element === document.documentElement) {
        return {
          getPropertyValue: (name: string) => {
            if (name === '--app-chart-series-1') return 'rgb(90, 91, 92)';
            if (name === 'color-scheme') return '';
            return '';
          },
        } as CSSStyleDeclaration;
      }

      return {
        color: 'var(--app-chart-series-1)',
        backgroundColor: 'var(--app-chart-series-1-fill)',
        getPropertyValue: (_name: string) => '',
      } as CSSStyleDeclaration;
    });

    expect(resolveThemedCssColorVar(document, '--app-chart-series-1', '#fallback')).toBe(
      'rgb(90, 91, 92)',
    );
  });

  it('returns the provided fallback when neither the probe nor the root token resolve a raw color', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) => {
      if (element === document.documentElement) {
        return {
          getPropertyValue: (name: string) => {
            if (name === '--missing-color') return 'var(--missing-color)';
            if (name === 'color-scheme') return '';
            return '';
          },
        } as CSSStyleDeclaration;
      }

      return {
        color: 'var(--missing-color)',
        backgroundColor: 'var(--missing-color)',
        getPropertyValue: (_name: string) => '',
      } as CSSStyleDeclaration;
    });

    expect(resolveThemedCssColorVar(document, '--missing-color', '#fallback')).toBe('#fallback');
  });

  it('returns the fallback when computed-style resolution throws', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => {
      throw new Error('boom');
    });

    expect(resolveThemedCssColorVar(document, '--app-chart-series-1', '#fallback')).toBe(
      '#fallback',
    );
  });
});
