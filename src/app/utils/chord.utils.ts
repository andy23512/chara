import { ChordTreeNode } from 'tangent-cc-lib';

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
