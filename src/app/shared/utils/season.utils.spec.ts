import { toSeasonNumber } from './season.utils';

describe('toSeasonNumber', () => {
  it('returns a finite number unchanged', () => {
    expect(toSeasonNumber(2023)).toBe(2023);
    expect(toSeasonNumber(0)).toBe(0);
  });

  it('returns undefined for non-finite numbers', () => {
    expect(toSeasonNumber(Infinity)).toBeUndefined();
    expect(toSeasonNumber(-Infinity)).toBeUndefined();
    expect(toSeasonNumber(NaN)).toBeUndefined();
  });

  it('parses a valid numeric string to a number', () => {
    expect(toSeasonNumber('2023')).toBe(2023);
  });

  it('returns undefined for non-numeric strings', () => {
    expect(toSeasonNumber('abc')).toBeUndefined();
  });

  it('returns undefined for null, undefined, boolean, and object', () => {
    expect(toSeasonNumber(null)).toBeUndefined();
    expect(toSeasonNumber(undefined)).toBeUndefined();
    expect(toSeasonNumber(true)).toBeUndefined();
    expect(toSeasonNumber({})).toBeUndefined();
  });
});
