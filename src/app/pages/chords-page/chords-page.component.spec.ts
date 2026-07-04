import { ChordKeyLabelType } from 'src/app/models/chord.models';
import { getChordCountSummary } from './chords-page.component';

describe('getChordCountSummary', () => {
  it('returns the total and filtered chord counts for the current search', () => {
    const chords = [
      {
        id: 1,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'A' }],
        textOutput: 'A',
      },
      {
        id: 2,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'B' }],
        textOutput: 'B',
      },
      {
        id: 3,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'C' }],
        textOutput: 'C',
      },
    ] as any[];

    expect(getChordCountSummary(chords, 'A', true, true)).toEqual({
      totalCount: 3,
      filteredCount: 1,
    });
  });
});
