import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ChordDataWithLabelStateAndEnglishWordRank } from '../models/chord.models';
import { pickRandomItem, pickRandomItemNTimes } from '../utils/random.utils';

interface AdaptationPageState {
  queue: ChordDataWithLabelStateAndEnglishWordRank[];
  history: ChordDataWithLabelStateAndEnglishWordRank[];
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
  withMethods((store) => ({
    restore() {
      patchState(store, () => initialState);
    },
    fillQueue(chords: ChordDataWithLabelStateAndEnglishWordRank[]) {
      patchState(store, () => ({
        queue: pickRandomItemNTimes(chords, QUEUE_SIZE),
      }));
    },
    checkText(
      text: string,
      time: number,
      chords: ChordDataWithLabelStateAndEnglishWordRank[],
    ) {
      patchState(store, ({ queue, history }) => {
        if (text.trim() === queue[0].textOutput.trim()) {
          return {
            queue: [...queue.slice(1), pickRandomItem(chords)],
            history: [...history, queue[0]],
            lastCorrectChordTime: time,
            buffer: [],
          };
        }
        return {};
      });
    },
  })),
);
