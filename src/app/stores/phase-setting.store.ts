import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { PhaseSetting } from '../models/phase-setting.models';
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

export const PhaseSettingStore = signalStore(
  {
    providedIn: 'root',
    protectedState: true,
  },
  withDevtools(PHASE_SETTING_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(PHASE_SETTING_STORE_KEY),
    parse(stateString: string) {
      return { ...INITIAL_PHASE_SETTING, ...JSON.parse(stateString) };
    },
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
