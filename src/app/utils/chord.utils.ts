import { pick } from 'ramda';
import {
  ACTIONS,
  ActionType,
  ChordTreeNode,
  KeyboardLayout,
  KeyLabelType,
  NON_KEY_ACTION_NAME_2_RAW_KEY_LABEL_MAP,
  NON_WSK_CODE_2_RAW_KEY_LABEL_MAP,
  OperatingSystemName,
  OS_2_META_KEY_LABEL_MAP,
} from 'tangent-cc-lib';
import {
  ChordData,
  ChordDataWithLabelState,
  ChordKeyLabel,
  ChordKeyLabelType,
} from '../models/chord.models';

export function flattenChordTreeNodes(
  chordTreeNodes: ChordTreeNode[],
): ChordTreeNode[] {
  return chordTreeNodes.reduce((acc, node) => {
    acc.push(node);
    if (node.children) {
      acc.push(...flattenChordTreeNodes(node.children));
    }
    return acc;
  }, [] as ChordTreeNode[]);
}

function getKeyLabelFromActionCode(
  actionCode: number,
  keyboardLayout: KeyboardLayout,
  operatingSystem: OperatingSystemName | undefined,
): ChordKeyLabel | null {
  // Implementation for getting key label from action code and keyboard layout
  const action = ACTIONS.find((a) => a.codeId === actionCode);
  if (action?.type === ActionType.WSK && action.keyCode) {
    const keyboardLayoutKey = keyboardLayout.layout[action?.keyCode];
    if (action.withShift && keyboardLayoutKey?.withShift) {
      return {
        type: ChordKeyLabelType.Char,
        c: keyboardLayoutKey.withShift.value,
        title: 'Tooltip', // TODO - add title
        isDeadKey: keyboardLayoutKey.withShift.type === 'dead-key',
      };
    } else if (keyboardLayoutKey?.unmodified) {
      return {
        type: ChordKeyLabelType.Char,
        c: keyboardLayoutKey.unmodified.value,
        title: 'Tooltip', // TODO - add title
        isDeadKey: keyboardLayoutKey.unmodified.type === 'dead-key',
      };
    }
  } else if (action?.type === ActionType.NonWSK && action.keyCode) {
    let rawKeyLabelMap = NON_WSK_CODE_2_RAW_KEY_LABEL_MAP;
    if (operatingSystem && OS_2_META_KEY_LABEL_MAP[operatingSystem]) {
      rawKeyLabelMap = {
        ...rawKeyLabelMap,
        ...OS_2_META_KEY_LABEL_MAP[operatingSystem],
      };
    }
    const rawKeyLabel = rawKeyLabelMap[action.keyCode];
    if (rawKeyLabel) {
      return { ...rawKeyLabel, variant: action.variant };
    }
  } else if (action?.type === ActionType.NonKey && action.actionName) {
    const rawKeyLabel =
      NON_KEY_ACTION_NAME_2_RAW_KEY_LABEL_MAP[action.actionName];
    if (rawKeyLabel) {
      return { ...rawKeyLabel, variant: action.variant };
    }
  } else if (action?.type === ActionType.WindowsAltCode && action.character) {
    return {
      type: ChordKeyLabelType.Char,
      c: action.character,
      title: 'Title', // TODO - add title
      isWindowsAltKey: true,
    };
  } else if (actionCode >= 32) {
    return {
      type: KeyLabelType.ActionCode,
      c: actionCode,
      title: 'Tooltip', // TODO - add title
    };
  }
  return null;
}

export function convertFlattenedChordTreeNodesToChordData(
  chordTreeNodes: ChordTreeNode[],
  keyboardLayout: KeyboardLayout,
  operatingSystem: OperatingSystemName | undefined,
): ChordData[] {
  const inputKeyLabelsMap = new Map<number, ChordKeyLabel[]>();
  const outputKeyLabelsMap = new Map<number, ChordKeyLabel[]>();

  function calculateInputKeyLabelsFromChordTreeNode(
    node: ChordTreeNode,
  ): ChordKeyLabel[] {
    if (!inputKeyLabelsMap.has(node.id)) {
      const outputKeyLabel = outputKeyLabelsMap.get(node.id)!;
      const inputKeyData = node.input
        .filter(Boolean)
        .map((actionCode) => {
          const keyLabel = getKeyLabelFromActionCode(
            actionCode,
            keyboardLayout,
            operatingSystem,
          );
          if (!keyLabel) {
            return null;
          }
          const indexInOutput = outputKeyLabel.findIndex(
            (k) =>
              k.type === keyLabel.type &&
              (k.c === keyLabel.c ||
                (typeof k.c === 'string' &&
                  typeof keyLabel.c === 'string' &&
                  k.c.toLowerCase() === keyLabel.c.toLowerCase())),
          );
          return {
            indexInOutput: indexInOutput === -1 ? Infinity : indexInOutput,
            keyLabel,
          };
        })
        .filter((v) => !!v) as {
        keyLabel: ChordKeyLabel;
        indexInOutput: number;
      }[];
      inputKeyData.sort((a, b) => a.indexInOutput - b.indexInOutput);
      inputKeyLabelsMap.set(
        node.id,
        inputKeyData.map((d) => d.keyLabel),
      );
    }
    return inputKeyLabelsMap.get(node.id)!;
  }

  function calculateOutputKeyLabelsFromChordTreeNode(node: ChordTreeNode) {
    outputKeyLabelsMap.set(
      node.id,
      node.output
        .map((actionCode) =>
          getKeyLabelFromActionCode(
            actionCode,
            keyboardLayout,
            operatingSystem,
          ),
        )
        .filter((v) => !!v) as ChordKeyLabel[],
    );
  }
  chordTreeNodes.forEach((node) => {
    calculateOutputKeyLabelsFromChordTreeNode(node);
    calculateInputKeyLabelsFromChordTreeNode(node);
  });

  return chordTreeNodes.map((node) => ({
    ...pick(
      [
        'id',
        'input',
        'actions',
        'output',
        'parentId',
        'actionAndPhraseHash',
        'isDynamicLibraryChord',
      ],
      node,
    ),
    inputKeyLabels: inputKeyLabelsMap.get(node.id)!,
    outputKeyLabels: outputKeyLabelsMap.get(node.id)!,
    ancestors: node.ancestors.map((ancestor) => ({
      inputKeyLabels: inputKeyLabelsMap.get(ancestor.id)!,
      input: ancestor.input,
      textOutput: calculateTextOutputFromChordOutput(
        ancestor.output,
        keyboardLayout,
      ),
      isDynamicLibraryChord: ancestor.isDynamicLibraryChord,
    })),
    textOutput: calculateTextOutputFromChordOutput(node.output, keyboardLayout),
  }));
}

function calculateTextOutputFromChordOutput(
  output: number[],
  keyboardLayout: KeyboardLayout,
): string {
  let textOutput = '';
  let pressCurrent = false;
  let releaseCurrent = false;
  let holdKeys: Partial<
    Record<
      | 'ShiftLeft'
      | 'ShiftRight'
      | 'MetaLeft'
      | 'MetaRight'
      | 'ControlLeft'
      | 'ControlRight',
      boolean
    >
  > = {};
  output.forEach((actionCode) => {
    const action = ACTIONS.find((a) => a.codeId === actionCode);
    const holdCtrlOrMeta =
      holdKeys['ControlLeft'] ||
      holdKeys['ControlRight'] ||
      holdKeys['MetaLeft'] ||
      holdKeys['MetaRight'];
    if (action?.type === ActionType.WSK && action.keyCode && !holdCtrlOrMeta) {
      const holdShift = holdKeys['ShiftLeft'] || holdKeys['ShiftRight'];
      const keyboardLayoutKey = keyboardLayout.layout[action?.keyCode];
      if (
        (action.withShift || holdShift) &&
        keyboardLayoutKey?.withShift &&
        keyboardLayoutKey?.withShift.type === 'text'
      ) {
        textOutput += keyboardLayoutKey.withShift.value;
      } else if (
        !holdShift &&
        keyboardLayoutKey?.unmodified &&
        keyboardLayoutKey?.unmodified.type === 'text'
      ) {
        textOutput += keyboardLayoutKey.unmodified.value;
      }
    } else if (action?.type === ActionType.NonWSK && action.keyCode) {
      if (action.keyCode === 'SpaceLeft' || action.keyCode === 'SpaceRight') {
        textOutput += ' ';
      } else if (
        action.keyCode === 'ShiftLeft' ||
        action.keyCode === 'ShiftRight' ||
        action.keyCode === 'MetaLeft' ||
        action.keyCode === 'MetaRight' ||
        action.keyCode === 'ControlLeft' ||
        action.keyCode === 'ControlRight'
      ) {
        if (pressCurrent) {
          holdKeys[action.keyCode] = true;
        }
        if (releaseCurrent) {
          holdKeys[action.keyCode] = false;
        }
      } else if (action.keyCode === 'Backspace') {
        textOutput = textOutput.slice(0, -1);
      }
    } else if (action?.type === ActionType.WindowsAltCode && action.character) {
      textOutput += action.character;
    }
    if (action?.type === ActionType.NonKey) {
      if (action.actionName === 'PressNext') {
        pressCurrent = true;
        releaseCurrent = false;
        return;
      }
      if (action.actionName === 'ReleaseNext') {
        releaseCurrent = true;
        pressCurrent = false;
        return;
      }
    }
    pressCurrent = false;
    releaseCurrent = false;
  });
  return textOutput;
}

export function appendLabelStateToChordData(
  chordData: ChordData,
  bookmarkedHashSet: Set<string>,
  blockedHashSet: Set<string>,
): ChordDataWithLabelState {
  return {
    ...chordData,
    bookmarked: bookmarkedHashSet.has(chordData.actionAndPhraseHash),
    blocked: blockedHashSet.has(chordData.actionAndPhraseHash),
  };
}
