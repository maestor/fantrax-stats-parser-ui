import { derivePositions } from './position-utils';

describe('derivePositions', () => {
  it('assigns sequential positions when no ties', () => {
    const input = [
      { teamName: 'A', tieRank: false },
      { teamName: 'B', tieRank: false },
      { teamName: 'C', tieRank: false },
    ];
    const result = derivePositions(input);
    expect(result.map(r => r.displayPosition)).toEqual(['1', '2', '3']);
  });

  it('shows position for first tied team, empty for subsequent', () => {
    const input = [
      { teamName: 'A', tieRank: false },
      { teamName: 'B', tieRank: false },
      { teamName: 'C', tieRank: true },
      { teamName: 'D', tieRank: false },
    ];
    const result = derivePositions(input);
    expect(result.map(r => r.displayPosition)).toEqual(['1', '2', '', '4']);
  });

  it('handles multiple consecutive ties', () => {
    const input = [
      { teamName: 'A', tieRank: false },
      { teamName: 'B', tieRank: true },
      { teamName: 'C', tieRank: true },
      { teamName: 'D', tieRank: false },
    ];
    const result = derivePositions(input);
    expect(result.map(r => r.displayPosition)).toEqual(['1', '', '', '4']);
  });

  it('preserves original entry properties', () => {
    const input = [{ teamName: 'A', tieRank: false, points: 42 }];
    const result = derivePositions(input);
    expect(result[0].teamName).toBe('A');
    expect(result[0].points).toBe(42);
  });

  it('returns empty array for empty input', () => {
    expect(derivePositions([])).toEqual([]);
  });
});
