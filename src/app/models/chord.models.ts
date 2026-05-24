import {
  ActionVariant,
  Chord,
  FontLogo,
  KeyLabelIcon,
  KeyLabelType,
} from 'tangent-cc-lib';

export enum ChordKeyLabelType {
  Char = 'char',
}

export type ChordKeyLabel = (
  | {
      type: ChordKeyLabelType.Char;
      c: string;
      title: string;
      isDeadKey?: boolean;
      isWindowsAltKey?: boolean;
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
    }
) & { variant?: ActionVariant };

export interface ChordData extends Chord {
  inputKeyLabels: ChordKeyLabel[];
  outputKeyLabels: ChordKeyLabel[];
  ancestorsKeyLabels: ChordKeyLabel[][];
  textOutput: string;
}

export interface ChordDataWithLabelState extends ChordData {
  bookmarked: boolean;
  blocked: boolean;
}
