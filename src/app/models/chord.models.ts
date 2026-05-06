import {
  Chord,
  FontLogo,
  KeyLabelIcon,
  KeyLabelType
} from 'tangent-cc-lib';

export enum ChordKeyLabelType {
  Char = 'char',
}

export type ChordKeyLabel =
  | {
      type: ChordKeyLabelType.Char;
      c: string;
      title: string;
      isDeadKey?: boolean;
    }
  | {
      type: KeyLabelType.String;
      c: string;
      title: string;
    }
  | {
      type: KeyLabelType.Icon;
      c: KeyLabelIcon;
      title: string;
    }
  | {
      type: KeyLabelType.Logo;
      c: FontLogo;
      title: string;
    }
  | {
      type: KeyLabelType.ActionCode;
      c: number;
      title: string;
    };

export interface ChordDataWithKeyLabels extends Chord {
  inputKeyLabels: ChordKeyLabel[];
  outputKeyLabels: ChordKeyLabel[];
  ancestorsKeyLabels: ChordKeyLabel[][];
}
