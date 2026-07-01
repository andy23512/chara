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
import { ChordSearchSetting } from '../models/chord-search-setting.models';
import { prefixStorageKey } from '../utils/store.utils';

const INITIAL_CHORD_SEARCH_SETTING: ChordSearchSetting = {
  chordInput: true,
  chordOutput: true,
};

const CHORD_SEARCH_SETTING_STORE_KEY = 'chordSearchSetting';

export const ChordSearchSettingStore = signalStore(
  { providedIn: 'root' },
  withDevtools(CHORD_SEARCH_SETTING_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(CHORD_SEARCH_SETTING_STORE_KEY),
    parse(stateString: string) {
      return { ...INITIAL_CHORD_SEARCH_SETTING, ...JSON.parse(stateString) };
    },
  }),
  withState(INITIAL_CHORD_SEARCH_SETTING),
  withMethods((store) => ({
    set<T extends keyof ChordSearchSetting>(
      key: T,
      value: ChordSearchSetting[T],
    ) {
      patchState(store, () => ({ [key]: value }));
    },
  })),
  withComputed((state) => ({
    onlyOneEnabled: computed(() => {
      const chordInput = state.chordInput();
      const chordOutput = state.chordOutput();
      return (chordInput && !chordOutput) || (!chordInput && chordOutput);
    }),
  })),
);
