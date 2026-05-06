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
  ChordDataWithKeyLabels,
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
      return rawKeyLabel;
    }
  } else if (action?.type === ActionType.NonKey && action.actionName) {
    const rawKeyLabel =
      NON_KEY_ACTION_NAME_2_RAW_KEY_LABEL_MAP[action.actionName];
    if (rawKeyLabel) {
      return rawKeyLabel;
    }
  } else if (actionCode >= 32) {
    return {
      type: KeyLabelType.ActionCode,
      c: actionCode,
      title: 'Tooltip', // TODO - add title
    };
  }
  return null;
}

export function convertFlattenedChordTreeNodesToChordDataWithKeyLabels(
  chordTreeNodes: ChordTreeNode[],
  keyboardLayout: KeyboardLayout,
  operatingSystem: OperatingSystemName | undefined,
): ChordDataWithKeyLabels[] {
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
            (k) => k.type === keyLabel.type && k.c === keyLabel.c,
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
    id: node.id,
    input: node.input,
    actions: node.actions,
    output: node.output,
    parentId: node.parentId,
    inputKeyLabels: inputKeyLabelsMap.get(node.id)!,
    outputKeyLabels: outputKeyLabelsMap.get(node.id)!,
    ancestorsKeyLabels: node.ancestors.map(
      (ancestor) => inputKeyLabelsMap.get(ancestor.id)!,
    ),
  }));
}
