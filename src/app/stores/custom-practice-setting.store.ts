import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { CustomPracticeSetting } from '../models/custom-practice-setting.models';
import { prefixStorageKey } from '../utils/store.utils';

const INITIAL_CUSTOM_PRACTICE_SETTING: CustomPracticeSetting = {
  hintDisplayMode: 'timeout',
};

const CUSTOM_PRACTICE_SETTING_STORE_KEY = 'customPracticeSetting';

export const CustomPracticeSettingStore = signalStore(
  { providedIn: 'root' },
  withDevtools(CUSTOM_PRACTICE_SETTING_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(CUSTOM_PRACTICE_SETTING_STORE_KEY),
    parse(stateString: string) {
      return { ...INITIAL_CUSTOM_PRACTICE_SETTING, ...JSON.parse(stateString) };
    },
  }),
  withState(INITIAL_CUSTOM_PRACTICE_SETTING),
  withMethods((store) => ({
    set<T extends keyof CustomPracticeSetting>(
      key: T,
      value: CustomPracticeSetting[T],
    ) {
      patchState(store, () => ({
        [key]: value,
      }));
    },
  })),
);
