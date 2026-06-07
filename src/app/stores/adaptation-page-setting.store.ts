import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { AdaptationPageSetting } from '../models/adaptation-page-setting.models';
import { prefixStorageKey } from '../utils/store.utils';

const INITIAL_ADAPTATION_PAGE_SETTING: AdaptationPageSetting = {
  practiceSetSize: 5,
  minRepsToPass: 10,
  minSpeedToPass: 30,
};
const ADAPTATION_SETTING_STORE_KEY = 'adaptationPageSetting';

export const AdaptationPageSettingStore = signalStore(
  {
    providedIn: 'root',
    protectedState: true,
  },
  withDevtools(ADAPTATION_SETTING_STORE_KEY),
  withStorageSync({
    key: prefixStorageKey(ADAPTATION_SETTING_STORE_KEY),
    parse(stateString: string) {
      return { ...INITIAL_ADAPTATION_PAGE_SETTING, ...JSON.parse(stateString) };
    },
  }),
  withState(INITIAL_ADAPTATION_PAGE_SETTING),
  withMethods((store) => ({
    set<K extends keyof AdaptationPageSetting>(
      key: K,
      value: AdaptationPageSetting[K],
    ) {
      patchState(store, (state) => ({
        ...state,
        [key]: value,
      }));
    },
  })),
);
