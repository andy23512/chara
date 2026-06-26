import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ChordGroup } from '../models/chord.models';
import { Phase } from '../models/phase.models';
import { pickRandomItemNTimes } from '../utils/random.utils';
import { PracticeStatisticStore } from './practice-statistic.store';

interface ChordPracticeViewState {
  queue: ChordGroup[];
  history: ChordGroup[];
  lastCorrectChordTime: number | null;
  chordIntervals: number[];
}

const QUEUE_SIZE = 40;
const HALF_QUEUE_SIZE = QUEUE_SIZE / 2;
const initialState: ChordPracticeViewState = {
  queue: [],
  history: [],
  lastCorrectChordTime: null,
  chordIntervals: [],
};

export const ChordPracticeViewStore = signalStore(
  withState(initialState),
  withMethods((store) => {
    const practiceStatisticStore = inject(PracticeStatisticStore);
    return {
      restore() {
        patchState(store, () => initialState);
      },
      fillQueue(chordGroups: ChordGroup[]) {
        patchState(store, () => ({
          queue: pickRandomItemNTimes(chordGroups, QUEUE_SIZE),
        }));
      },
      checkText(
        text: string,
        time: number,
        chordGroups: ChordGroup[],
        phase: Phase,
      ) {
        patchState(
          store,
          ({ queue, history, lastCorrectChordTime, chordIntervals }) => {
            if (text.trim() === queue[0].textOutput.trim()) {
              if (lastCorrectChordTime) {
                const interval = time - lastCorrectChordTime;
                practiceStatisticStore.saveSpeedRecord(
                  phase,
                  queue[0],
                  interval,
                );
              }
              let newQueueItems: ChordGroup[] = [];
              if (queue.length <= HALF_QUEUE_SIZE) {
                const indexOfLastItem = chordGroups.findIndex(
                  (c) => c.textOutput === queue.at(-1)?.textOutput,
                );
                const previousIndex =
                  indexOfLastItem === -1 ? null : indexOfLastItem;
                newQueueItems = pickRandomItemNTimes(
                  chordGroups,
                  HALF_QUEUE_SIZE,
                  previousIndex,
                );
              }
              return {
                queue: [...queue.slice(1), ...newQueueItems],
                history: [...history, queue[0]],
                lastCorrectChordTime: time,
                chordIntervals: lastCorrectChordTime
                  ? [...chordIntervals, time - lastCorrectChordTime]
                  : [...chordIntervals],
              };
            }
            return {};
          },
        );
      },
      pause() {
        patchState(store, (state) => ({
          ...state,
          lastCorrectChordTime: null,
        }));
      },
    };
  }),
  withComputed((state) => ({
    chpm: computed(() => {
      const chordIntervals = state.chordIntervals();
      const totalPeriodInMinute =
        chordIntervals.reduce((a, b) => a + b, 0) / 1000 / 60;
      if (totalPeriodInMinute === 0) {
        return 0;
      }
      const characterNumber = chordIntervals.length;
      return Math.floor(characterNumber / totalPeriodInMinute);
    }),
  })),
);
