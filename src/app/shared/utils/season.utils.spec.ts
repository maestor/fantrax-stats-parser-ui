import { describe, expect, it } from 'vitest';

import { formatPlayoffYear, formatSeasonDisplay, formatSeasonShort } from './season.utils';

describe('season.utils', () => {
  it('formats season display values using start and end year', () => {
    expect(formatSeasonDisplay(2013)).toBe('2013-14');
    expect(formatSeasonDisplay(2022)).toBe('2022-23');
  });

  it('formats playoff year values using the season end year', () => {
    expect(formatPlayoffYear(2013)).toBe('2014');
    expect(formatPlayoffYear(2015)).toBe('2016');
    expect(formatPlayoffYear(2022)).toBe('2023');
  });

  it('formats short season values using two-digit years', () => {
    expect(formatSeasonShort(2013)).toBe('13-14');
    expect(formatSeasonShort(2022)).toBe('22-23');
  });
});
