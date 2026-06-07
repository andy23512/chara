import { withStorageSync } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ChordGroup } from '../models/chord.models';
import { Phase } from '../models/phase.models';
import { PracticeStatisticState } from '../models/practice-statistic-state.models';
import { prefixStorageKey } from '../utils/store.utils';

const INITIAL_PRACTICE_STATISTIC_STATE: PracticeStatisticState = {
  [Phase.Adaptation]: {},
  [Phase.Realization]: {},
  [Phase.Accumulation]: {},
};
const PRACTICE_STATISTIC_STORE_KEY = 'practiceStatistic';

export const PracticeStatisticStore = signalStore(
  {
    providedIn: 'root',
  },
  withState(INITIAL_PRACTICE_STATISTIC_STATE),
  withStorageSync({
    key: prefixStorageKey(PRACTICE_STATISTIC_STORE_KEY),
    parse(stateString: string) {
      return {
        ...INITIAL_PRACTICE_STATISTIC_STATE,
        ...JSON.parse(stateString),
      };
    },
  }),
  withState(INITIAL_PRACTICE_STATISTIC_STATE),
  withMethods((store) => ({
    saveSpeedRecord(phase: Phase, chordGroup: ChordGroup, interval: number) {
      patchState(store, (state) => {
        const target = state[phase][chordGroup.textOutput];
        const lastTenIntervals = [
          ...(target?.lastTenIntervals || []),
          interval,
        ].slice(-10);
        const totalPeriodInMinutes =
          lastTenIntervals.reduce((sum, current) => sum + current, 0) / 60000;
        const lastTenAverageChordPerMinute = totalPeriodInMinutes
          ? Math.floor(lastTenIntervals.length / totalPeriodInMinutes)
          : 0;
        const correctCount = (target?.correctCount || 0) + 1;
        return {
          ...state,
          [phase]: {
            ...state[phase],
            [chordGroup.textOutput]: {
              lastTenIntervals,
              lastTenAverageChordPerMinute,
              correctCount,
            },
          },
        };
      });
    },
  })),
);
