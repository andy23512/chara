import { ChordTreeNode, KeyboardLayout, KeyLabelType } from 'tangent-cc-lib';
import { ChordData, ChordKeyLabelType } from '../models/chord.models';
import {
  appendLabelStateToChordData,
  convertFlattenedChordTreeNodesToChordData,
  flattenChordTreeNodes,
} from './chord.utils';

// Real action codes from tangent-cc-lib:
//   WSK:        97 = a, 98 = b, 99 = c, 100 = d, 65 = Shift+a, 66 = Shift+b
//   NonWSK:     32 / 300 = SpaceLeft, 544 = SpaceRight, 298 = Backspace,
//               296 = Enter, 513 = ShiftLeft, 517 = ShiftRight,
//               480 / 512 = ControlLeft, 516 = ControlRight,
//               515 = MetaLeft, 519 = MetaRight
//   NonKey:     523 = PressNext, 524 = ReleaseNext, 256 = NoKeyPressed
//   AltCode:    233 = é
const A = 97;
const B = 98;
const C = 99;
const D = 100;
const SHIFT_A = 65;
const SHIFT_B = 66;
const SPACE_LEFT = 32;
const SPACE_RIGHT = 544;
const BACKSPACE = 298;
const ENTER = 296;
const SHIFT_LEFT = 513;
const SHIFT_RIGHT = 517;
const CONTROL_RIGHT = 516;
const META_RIGHT = 519;
const CONTROL_LEFT = 512;
const META_LEFT = 515;
const PRESS_NEXT = 523;
const RELEASE_NEXT = 524;
const NO_KEY_PRESSED = 256;
const E_ACUTE = 233;

// KeyA / KeyB have a Shift variant, KeyC does not, KeyD is a dead key.
const layout = {
  id: 'test',
  name: 'Test',
  reference: '',
  layout: {
    KeyA: {
      unmodified: { type: 'text', value: 'a' },
      withShift: { type: 'text', value: 'A' },
    },
    KeyB: {
      unmodified: { type: 'text', value: 'b' },
      withShift: { type: 'text', value: 'B' },
    },
    KeyC: { unmodified: { type: 'text', value: 'c' } },
    KeyD: { unmodified: { type: 'dead-key', value: '^' } },
  },
} as unknown as KeyboardLayout;

function node(
  partial: Pick<ChordTreeNode, 'id' | 'input' | 'output'> &
    Partial<ChordTreeNode>,
): ChordTreeNode {
  return {
    actions: [],
    parentId: null,
    actionAndPhraseHash: `hash-${partial.id}`,
    isDynamicLibraryChord: false,
    level: 0,
    children: [],
    ancestors: [],
    ...partial,
  };
}

const pad = (...codes: number[]) => [...Array(9 - codes.length).fill(0), ...codes];

function convert(
  nodes: ChordTreeNode[],
  operatingSystem: Parameters<
    typeof convertFlattenedChordTreeNodesToChordData
  >[2] = undefined,
): ChordData[] {
  return convertFlattenedChordTreeNodesToChordData(
    nodes,
    layout,
    operatingSystem,
  );
}

const textOf = (output: number[]) =>
  convert([node({ id: 1, input: pad(A), output })])[0].textOutput;

describe('flattenChordTreeNodes', () => {
  it('returns an empty list for no nodes', () => {
    expect(flattenChordTreeNodes([])).toEqual([]);
  });

  it('lists each node before its descendants', () => {
    const grandchild = node({ id: 3, input: [], output: [] });
    const child = node({ id: 2, input: [], output: [], children: [grandchild] });
    const sibling = node({ id: 4, input: [], output: [] });
    const parent = node({ id: 1, input: [], output: [], children: [child] });
    expect(
      flattenChordTreeNodes([parent, sibling]).map((n) => n.id),
    ).toEqual([1, 2, 3, 4]);
  });

  it('keeps the original node objects', () => {
    const child = node({ id: 2, input: [], output: [] });
    const parent = node({ id: 1, input: [], output: [], children: [child] });
    const [first, second] = flattenChordTreeNodes([parent]);
    expect(first).toBe(parent);
    expect(second).toBe(child);
  });

  it('copes with a node that has no children list', () => {
    const bare = { ...node({ id: 1, input: [], output: [] }) } as Partial<ChordTreeNode>;
    delete bare.children;
    expect(
      flattenChordTreeNodes([bare as ChordTreeNode]).map((n) => n.id),
    ).toEqual([1]);
  });
});

describe('convertFlattenedChordTreeNodesToChordData', () => {
  describe('key labels', () => {
    const outputLabels = (output: number[], os?: 'macOS' | 'Windows') =>
      convert([node({ id: 1, input: [], output })], os)[0].outputKeyLabels;

    it('labels a letter key with the character of the layout', () => {
      expect(outputLabels([A])).toEqual([
        {
          type: ChordKeyLabelType.Char,
          c: 'a',
          title: 'Tooltip',
          isDeadKey: false,
        },
      ]);
    });

    it('uses the Shift variant of the layout for shifted letters', () => {
      expect(outputLabels([SHIFT_A])[0]).toEqual(
        jasmine.objectContaining({ type: ChordKeyLabelType.Char, c: 'A' }),
      );
    });

    // Current behavior: with no Shift variant in the layout, the shifted
    // action code is labelled with the unmodified character.
    it('falls back to the unmodified character when the layout has no Shift variant', () => {
      const shiftC = 67;
      expect(outputLabels([shiftC])[0]).toEqual(
        jasmine.objectContaining({ type: ChordKeyLabelType.Char, c: 'c' }),
      );
    });

    it('marks dead keys', () => {
      expect(outputLabels([D])[0]).toEqual(
        jasmine.objectContaining({ c: '^', isDeadKey: true }),
      );
    });

    it('drops keys that the layout does not define', () => {
      const keyE = 101;
      expect(outputLabels([keyE])).toEqual([]);
    });

    it('labels special keys from the key label table, keeping the variant', () => {
      expect(outputLabels([SPACE_RIGHT])).toEqual([
        jasmine.objectContaining({ variant: 'right' }),
      ]);
      expect(outputLabels([BACKSPACE])).toEqual([
        jasmine.objectContaining({ type: KeyLabelType.Icon, c: 'backspace' }),
      ]);
    });

    it('labels non-key actions', () => {
      expect(outputLabels([PRESS_NEXT])).toEqual([
        jasmine.objectContaining({ type: KeyLabelType.Icon, c: 'download' }),
      ]);
      expect(outputLabels([NO_KEY_PRESSED])).toEqual([
        jasmine.objectContaining({ type: KeyLabelType.Icon, c: 'block' }),
      ]);
    });

    it('labels Windows alt-code characters', () => {
      expect(outputLabels([E_ACUTE])).toEqual([
        {
          type: ChordKeyLabelType.Char,
          c: 'é',
          title: 'Title',
          isWindowsAltKey: true,
        },
      ]);
    });

    it('labels an unknown action code of 32 or more with the code itself', () => {
      expect(outputLabels([9999])).toEqual([
        { type: KeyLabelType.ActionCode, c: 9999, title: 'Tooltip' },
      ]);
    });

    it('drops an unknown action code below 32', () => {
      expect(outputLabels([5])).toEqual([]);
    });

    it('uses the Command icon for Meta on Apple systems and the default elsewhere', () => {
      expect(outputLabels([META_LEFT], 'macOS')[0]).toEqual(
        jasmine.objectContaining({ c: 'keyboard_command_key', variant: 'left' }),
      );
      expect(outputLabels([META_LEFT], 'Windows')[0].c).not.toBe(
        'keyboard_command_key',
      );
      expect(outputLabels([META_LEFT])[0].c).toBe('apps');
    });
  });

  describe('input key labels', () => {
    const inputChars = (input: number[], output: number[]) =>
      convert([node({ id: 1, input, output })])[0].inputKeyLabels.map(
        (l) => l.c,
      );

    it('ignores the zero padding of the input', () => {
      expect(inputChars(pad(A, B), [A, B])).toEqual(['a', 'b']);
    });

    it('orders input keys by their first position in the output', () => {
      expect(inputChars(pad(A, B, C), [C, A, B])).toEqual(['c', 'a', 'b']);
    });

    it('matches input keys to the output case-insensitively', () => {
      expect(inputChars(pad(B, SHIFT_A), [A, B])).toEqual(['A', 'b']);
    });

    // Both keys are missing from the output, so both sort keys are Infinity and
    // the subtraction is NaN, which the sort treats as "equal". That is the
    // wanted stable order, so keep it.
    it('keeps keys that are absent from the output in their original order, after the rest', () => {
      expect(inputChars(pad(D, C, A, B), [B])).toEqual(['b', '^', 'c', 'a']);
    });

    it('drops input keys that have no label', () => {
      const keyE = 101;
      expect(inputChars(pad(A, keyE, B), [A, B])).toEqual(['a', 'b']);
    });

    it('uses the first matching output position for a repeated character', () => {
      expect(inputChars(pad(A, B), [B, A, B])).toEqual(['b', 'a']);
    });

    it('matches on label type as well as value', () => {
      // 9999 is an ActionCode label, never equal to a character label.
      const labels = convert([node({ id: 1, input: pad(9999, A), output: [A] })])[0]
        .inputKeyLabels;
      expect(labels.map((l) => l.c)).toEqual(['a', 9999]);
    });
  });

  describe('result shape', () => {
    it('copies only the chord fields and adds the computed ones', () => {
      const n = node({
        id: 7,
        input: pad(A),
        output: [B],
        actions: [1, 2, 3],
        parentId: 5,
        actionAndPhraseHash: 'abc',
        isDynamicLibraryChord: true,
        level: 3,
      });
      const [data] = convert([n]);
      expect(Object.keys(data).sort()).toEqual(
        [
          'actionAndPhraseHash',
          'actions',
          'ancestors',
          'compoundAncestors',
          'dynamicLibraryAncestors',
          'id',
          'input',
          'inputKeyLabels',
          'isDynamicLibraryChord',
          'output',
          'outputKeyLabels',
          'parentId',
          'textOutput',
        ].sort(),
      );
      expect(data).toEqual(
        jasmine.objectContaining({
          id: 7,
          actions: [1, 2, 3],
          parentId: 5,
          actionAndPhraseHash: 'abc',
          isDynamicLibraryChord: true,
          textOutput: 'b',
        }),
      );
    });

    it('returns one entry per node, in the same order', () => {
      const result = convert([
        node({ id: 3, input: pad(A), output: [A] }),
        node({ id: 1, input: pad(B), output: [B] }),
      ]);
      expect(result.map((d) => d.id)).toEqual([3, 1]);
    });

    it('returns an empty list for no nodes', () => {
      expect(convert([])).toEqual([]);
    });
  });

  describe('ancestors', () => {
    const parentNode = (over: Partial<ChordTreeNode> = {}) =>
      node({
        id: 1,
        input: pad(A, B),
        output: [C],
        actionAndPhraseHash: 'parent-hash',
        ...over,
      });
    const childOf = (ancestors: ChordTreeNode[]) =>
      node({ id: 9, input: pad(D), output: [A], ancestors, parentId: 1 });

    it('describes each ancestor with its labels, text output and hash', () => {
      const parent = parentNode();
      const data = convert([parent, childOf([parent])]);
      expect(data[1].ancestors).toEqual([
        {
          inputKeyLabels: data[0].inputKeyLabels,
          input: parent.input,
          textOutput: 'c',
          isDynamicLibraryChord: false,
          actionAndPhraseHash: 'parent-hash',
        },
      ]);
    });

    it('has no ancestors for a top-level chord', () => {
      const [data] = convert([node({ id: 1, input: pad(A), output: [A] })]);
      expect(data.ancestors).toEqual([]);
      expect(data.dynamicLibraryAncestors).toEqual([]);
      expect(data.compoundAncestors).toEqual([]);
    });

    it('treats all ancestors as dynamic library chords when none is a compound chord', () => {
      const p1 = parentNode({ id: 1, isDynamicLibraryChord: true });
      const p2 = parentNode({ id: 2, isDynamicLibraryChord: true });
      const data = convert([p1, p2, childOf([p1, p2])]);
      expect(data[2].dynamicLibraryAncestors.length).toBe(2);
      expect(data[2].compoundAncestors).toEqual([]);
    });

    it('splits at the first ancestor that is not a dynamic library chord', () => {
      const dynamic = parentNode({ id: 1, isDynamicLibraryChord: true });
      const compound = parentNode({ id: 2, isDynamicLibraryChord: false });
      const dynamicAfter = parentNode({ id: 3, isDynamicLibraryChord: true });
      const data = convert([
        dynamic,
        compound,
        dynamicAfter,
        childOf([dynamic, compound, dynamicAfter]),
      ]);
      const child = data[3];
      expect(child.dynamicLibraryAncestors.map((a) => a.actionAndPhraseHash)).toEqual([
        'parent-hash',
      ]);
      // everything from the first compound ancestor on is "compound", even a
      // later dynamic library chord.
      expect(child.compoundAncestors.length).toBe(2);
      expect(child.compoundAncestors[1].isDynamicLibraryChord).toBe(true);
    });

    it('treats a single non-dynamic ancestor as a compound ancestor', () => {
      const parent = parentNode({ isDynamicLibraryChord: false });
      const data = convert([parent, childOf([parent])]);
      expect(data[1].dynamicLibraryAncestors).toEqual([]);
      expect(data[1].compoundAncestors.length).toBe(1);
    });
  });

  describe('text output', () => {
    it('writes letters and spaces', () => {
      expect(textOf([A, SPACE_LEFT, B, SPACE_RIGHT, C])).toBe('a b c');
    });

    it('writes shifted letters', () => {
      expect(textOf([SHIFT_A, B])).toBe('Ab');
    });

    it('writes the unmodified character when a shifted code has no Shift variant', () => {
      expect(textOf([67])).toBe('c');
    });

    it('ignores dead keys, unknown keys and keys without text', () => {
      expect(textOf([A, D, 101, ENTER, NO_KEY_PRESSED, B])).toBe('ab');
    });

    it('writes Windows alt-code characters', () => {
      expect(textOf([A, E_ACUTE])).toBe('aé');
    });

    it('removes the previous character on Backspace', () => {
      expect(textOf([A, B, BACKSPACE, C])).toBe('ac');
    });

    it('leaves the text empty when Backspace has nothing to remove', () => {
      expect(textOf([BACKSPACE, BACKSPACE])).toBe('');
    });

    it('returns an empty string for an empty output', () => {
      expect(textOf([])).toBe('');
    });

    describe('held modifier keys', () => {
      it('holds Shift when it is pressed with PressNext', () => {
        expect(textOf([PRESS_NEXT, SHIFT_LEFT, A, B])).toBe('AB');
      });

      it('lets go of Shift with ReleaseNext', () => {
        expect(textOf([PRESS_NEXT, SHIFT_LEFT, A, RELEASE_NEXT, SHIFT_LEFT, B])).toBe(
          'Ab',
        );
      });

      it('does not hold Shift without PressNext', () => {
        expect(textOf([SHIFT_LEFT, A])).toBe('a');
      });

      it('only applies PressNext to the very next action', () => {
        expect(textOf([PRESS_NEXT, A, SHIFT_LEFT, B])).toBe('ab');
      });

      it('applies held Shift to a shifted action code too', () => {
        expect(textOf([PRESS_NEXT, SHIFT_LEFT, SHIFT_B])).toBe('B');
      });

      // Current behavior: with Shift held, a key that has no Shift variant in
      // the layout produces no text at all.
      it('writes nothing for a key without a Shift variant while Shift is held', () => {
        expect(textOf([PRESS_NEXT, SHIFT_LEFT, C, A])).toBe('A');
      });

      it('writes no text for letters while Control is held', () => {
        expect(textOf([PRESS_NEXT, CONTROL_LEFT, A, B])).toBe('');
      });

      it('writes no text for letters while Meta is held', () => {
        expect(textOf([PRESS_NEXT, META_LEFT, A])).toBe('');
      });

      it('treats the right-hand modifier keys like the left-hand ones', () => {
        expect(textOf([PRESS_NEXT, SHIFT_RIGHT, A])).toBe('A');
        expect(textOf([PRESS_NEXT, CONTROL_RIGHT, A])).toBe('');
        expect(textOf([PRESS_NEXT, META_RIGHT, A])).toBe('');
      });

      it('keeps the left and right Shift keys separate', () => {
        expect(
          textOf([PRESS_NEXT, SHIFT_LEFT, RELEASE_NEXT, SHIFT_RIGHT, A]),
        ).toBe('A');
        expect(
          textOf([
            PRESS_NEXT,
            SHIFT_LEFT,
            RELEASE_NEXT,
            SHIFT_LEFT,
            PRESS_NEXT,
            SHIFT_RIGHT,
            A,
          ]),
        ).toBe('A');
      });

      it('writes letters again once Control is released', () => {
        expect(
          textOf([PRESS_NEXT, CONTROL_LEFT, A, RELEASE_NEXT, CONTROL_LEFT, B]),
        ).toBe('b');
      });
    });
  });
});

describe('appendLabelStateToChordData', () => {
  const chordData = (hash: string) =>
    convert([
      node({ id: 1, input: pad(A), output: [A], actionAndPhraseHash: hash }),
    ])[0];

  it('marks a chord as bookmarked when its hash is in the bookmark set', () => {
    const result = appendLabelStateToChordData(
      chordData('h1'),
      new Set(['h1']),
      new Set(),
    );
    expect(result.bookmarked).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it('marks a chord as blocked when its hash is in the blocked set', () => {
    const result = appendLabelStateToChordData(
      chordData('h1'),
      new Set(),
      new Set(['h1']),
    );
    expect(result.bookmarked).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it('marks neither when the hash is in neither set', () => {
    const result = appendLabelStateToChordData(
      chordData('h1'),
      new Set(['other']),
      new Set(['other']),
    );
    expect(result.bookmarked).toBe(false);
    expect(result.blocked).toBe(false);
  });

  it('can mark a chord as both bookmarked and blocked', () => {
    const result = appendLabelStateToChordData(
      chordData('h1'),
      new Set(['h1']),
      new Set(['h1']),
    );
    expect(result.bookmarked).toBe(true);
    expect(result.blocked).toBe(true);
  });

  it('keeps all the chord data and does not change the input object', () => {
    const data = chordData('h1');
    const result = appendLabelStateToChordData(data, new Set(['h1']), new Set());
    expect(result).toEqual(jasmine.objectContaining(data));
    expect('bookmarked' in data).toBe(false);
  });
});
