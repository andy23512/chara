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
  ancestors: AncestorData[];
  dynamicLibraryAncestors: AncestorData[];
  compoundAncestors: AncestorData[];
  textOutput: string;
}

export interface AncestorData {
  inputKeyLabels: ChordKeyLabel[];
  input: number[];
  textOutput: string;
  isDynamicLibraryChord: boolean;
}

export interface ChordDataWithLabelState extends ChordData {
  bookmarked: boolean;
  blocked: boolean;
}

export interface ChordDataWithLabelStateAndStatistic
  extends ChordDataWithLabelState {
  adaptation: {
    correctCount: number | null;
    lastTenAverageChordPerMinute: number | null;
    passed: boolean;
  };
  realization: {
    correctCount: number | null;
    lastTenAverageChordPerMinute: number | null;
    passed: boolean;
  };
}

export interface ChordGroup {
  textOutput: string;
  englishWordRank: number;
  bookmarked: boolean;
  nonBlockedChords: ChordDataWithLabelState[];
}

export interface ChordGroupWithStats extends ChordGroup {
  passed: boolean;
  lastTenAverageChordPerMinute: number;
}
