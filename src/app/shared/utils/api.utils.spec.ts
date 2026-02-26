import { toApiTeamId } from './api.utils';

describe('toApiTeamId', () => {
  it('returns undefined when teamId is "1" (the all-teams sentinel)', () => {
    expect(toApiTeamId('1')).toBeUndefined();
  });

  it('returns the teamId unchanged for any real team id', () => {
    expect(toApiTeamId('2')).toBe('2');
    expect(toApiTeamId('123')).toBe('123');
  });
});
