import { getChartSeriesColors } from './chart-theme.utils';

describe('chart theme utilities', () => {
  afterEach(() => {
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
});
