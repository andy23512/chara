import {
  ChordInNumberListForm,
  convertChordInNumberListFormToChord,
  convertChordsToChordTreeNodes,
  parseChordActions,
  parsePhrase,
} from 'tangent-cc-lib';

const mockRawChords = [
  {
    chordActions: '001C86C0000000000000000000000000',
    phrase: '022E6C696231023E',
  },
  {
    chordActions: '001C861000000000000000002068836F',
    phrase: '61726D',
  },
];
export const MOCK_CHORD_TREE_NODES = convertChordsToChordTreeNodes(
  mockRawChords
    .map(
      ({ chordActions, phrase }) =>
        [
          parseChordActions(chordActions),
          parsePhrase(phrase),
        ] as ChordInNumberListForm,
    )
    .map(convertChordInNumberListFormToChord),
);
