import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ProfileLayoutMap } from 'tangent-cc-lib';
import { prefixStorageKey } from '../utils/store.utils';

const DEVICE_LAYOUT_STORE_KEY = 'deviceLayout';
export const DeviceLayoutStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools(DEVICE_LAYOUT_STORE_KEY),
  withStorageSync(prefixStorageKey(DEVICE_LAYOUT_STORE_KEY)),
  withState({
    profileLayoutMap: {} as ProfileLayoutMap,
  }),
  withMethods((store) => ({
    setProfileLayoutMap(profileLayoutMap: ProfileLayoutMap) {
      patchState(store, (state) => ({ ...state, profileLayoutMap }));
    },
  })),
);
