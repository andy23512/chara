import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  ChordGroup
} from '../models/chord.models';
import { Phase } from '../models/phase.models';
import { pickRandomItem, pickRandomItemNTimes } from '../utils/random.utils';
import { PracticeStatisticStore } from './practice-statistic.store';

interface AdaptationPageState {
  queue: ChordGroup[];
  history: ChordGroup[];
  lastCorrectChordTime: number | null;
}

const ADAPTATION_PAGE_STORE_KEY = 'adaptationPage';
const QUEUE_SIZE = 20;
const initialState: AdaptationPageState = {
  queue: [],
  history: [],
  lastCorrectChordTime: null,
};

export const AdaptationPageStore = signalStore(
  withDevtools(ADAPTATION_PAGE_STORE_KEY),
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
      checkText(text: string, time: number, chordGroups: ChordGroup[]) {
        patchState(store, ({ queue, history, lastCorrectChordTime }) => {
          if (text.trim() === queue[0].textOutput.trim()) {
            if (lastCorrectChordTime) {
              const interval = time - lastCorrectChordTime;
              practiceStatisticStore.saveSpeedRecord(
                Phase.Adaptation,
                queue[0],
                interval,
              );
            }
            return {
              queue: [
                ...queue.slice(1),
                pickRandomItem(
                  chordGroups.filter(
                    (c) => c.textOutput !== queue.at(-1)?.textOutput,
                  ),
                ),
              ],
              history: [...history, queue[0]],
              lastCorrectChordTime: time,
            };
          }
          return {};
        });
      },
    };
  }),
);
