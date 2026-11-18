import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { PhaseSetting } from '../models/phase-setting.models';
import { Phase } from '../models/phase.models';
import { prefixStorageKey } from '../utils/store.utils';

const INITIAL_PHASE_SETTING: PhaseSetting = {
  adaptation: {
    practiceSetSize: 5,
    minRepsToPass: 50,
    minSpeedToPass: 30,
  },
  realization: {
    practiceSetSize: 5,
    minRepsToPass: 50,
    minSpeedToPass: 50,
  },
};
const PHASE_SETTING_STORE_KEY = 'phaseSetting';

/** A practice set smaller than this leaves the practice view with too little to practice. */
export const MIN_PRACTICE_SET_SIZE = 3;

/** Brings a practice set size (maybe empty, fractional or saved by an older version) to a usable value. */
export function normalizePracticeSetSize(value: unknown): number {
  const size =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.floor(value)
      : MIN_PRACTICE_SET_SIZE;
  return Math.max(MIN_PRACTICE_SET_SIZE, size);
}

function parsePhaseSetting(stateString: string): PhaseSetting {
  const saved = JSON.parse(stateString) ?? {};
  const parsePhase = (phase: Phase.Adaptation | Phase.Realization) => ({
    ...INITIAL_PHASE_SETTING[phase],
    ...saved[phase],
    // A missing size gets the default; a saved size that is unusable (for
    // example null) gets the minimum, as when the field is left empty.
    practiceSetSize: normalizePracticeSetSize(
      saved[phase]?.practiceSetSize === undefined
        ? INITIAL_PHASE_SETTING[phase].practiceSetSize
        : saved[phase].practiceSetSize,
    ),
  });
  return {
    ...INITIAL_PHASE_SETTING,
    ...saved,
    [Phase.Adaptation]: parsePhase(Phase.Adaptation),
    [Phase.Realization]: parsePhase(Phase.Realization),
  };
}

export const PhaseSettingStore = signalStore(
  {
    providedIn: 'root',
    protectedState: true,
  },
  withDevtools(PHASE_SETTING_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(PHASE_SETTING_STORE_KEY),
    parse: parsePhaseSetting,
  }),
  withState(INITIAL_PHASE_SETTING),
  withMethods((store) => ({
    set<P extends keyof PhaseSetting, K extends keyof PhaseSetting[P]>(
      phase: P,
      key: K,
      value: PhaseSetting[P][K],
    ) {
      patchState(store, (state) => ({
        ...state,
        [phase]: {
          ...state[phase],
          [key]: value,
        },
      }));
    },
  })),
);
