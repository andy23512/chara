import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { ChordLabelState } from '../models/chord-label-state.models';
import { ChordData } from '../models/chord.models';
import { prefixStorageKey } from '../utils/store.utils';

const CHORD_LABEL_STORE_KEY = 'chordLabel';

const INITIAL_CHORD_LABEL_STATE: ChordLabelState = {
  bookmarkedHashes: [],
  blockedHashes: [],
};

export const ChordLabelStore = signalStore(
  {
    providedIn: 'root',
    protectedState: true,
  },
  withDevtools(CHORD_LABEL_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(CHORD_LABEL_STORE_KEY),
    parse(stateString: string) {
      return { ...INITIAL_CHORD_LABEL_STATE, ...JSON.parse(stateString) };
    },
  }),
  withState(INITIAL_CHORD_LABEL_STATE),
  withMethods((store) => ({
    bookmarkChord(chord: ChordData) {
      patchState(store, (state) => ({
        ...state,
        bookmarkedHashes: [
          ...state.bookmarkedHashes,
          chord.actionAndPhraseHash,
        ],
      }));
    },
    bookmarkChords(chords: ChordData[]) {
      patchState(store, (state) => ({
        ...state,
        bookmarkedHashes: [
          ...state.bookmarkedHashes,
          ...chords.map((c) => c.actionAndPhraseHash),
        ],
      }));
    },
    unbookmarkChord({ actionAndPhraseHash }: ChordData) {
      patchState(store, (state) => ({
        ...state,
        bookmarkedHashes: state.bookmarkedHashes.filter(
          (h) => h !== actionAndPhraseHash,
        ),
      }));
    },
    unbookmarkChords(chords: ChordData[]) {
      patchState(store, (state) => {
        const actionAndPhraseHashSet = new Set(
          chords.map((c) => c.actionAndPhraseHash),
        );
        return {
          ...state,
          bookmarkedHashes: state.bookmarkedHashes.filter(
            (h) => !actionAndPhraseHashSet.has(h),
          ),
        };
      });
    },
    blockChord(chord: ChordData) {
      patchState(store, (state) => ({
        ...state,
        blockedHashes: [...state.blockedHashes, chord.actionAndPhraseHash],
      }));
    },
    blockChords(chords: ChordData[]) {
      patchState(store, (state) => ({
        ...state,
        blockedHashes: [
          ...state.blockedHashes,
          ...chords.map((c) => c.actionAndPhraseHash),
        ],
      }));
    },
    unblockChord({ actionAndPhraseHash }: ChordData) {
      patchState(store, (state) => ({
        ...state,
        blockedHashes: state.blockedHashes.filter(
          (h) => h !== actionAndPhraseHash,
        ),
      }));
    },
    unblockChords(chords: ChordData[]) {
      patchState(store, (state) => {
        const actionAndPhraseHashSet = new Set(
          chords.map((c) => c.actionAndPhraseHash),
        );
        return {
          ...state,
          blockedHashes: state.bookmarkedHashes.filter(
            (h) => !actionAndPhraseHashSet.has(h),
          ),
        };
      });
    },
  })),
  withComputed((state) => ({
    bookmarkedHashSet: computed(() => {
      return new Set(state.bookmarkedHashes());
    }),
    blockedHashSet: computed(() => {
      return new Set(state.blockedHashes());
    }),
  })),
);
