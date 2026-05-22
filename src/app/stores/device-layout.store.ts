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
  withComputed((state) => ({
    hasLoadedProfileLayoutMap: computed(() => {
      const profileLayoutMap = state.profileLayoutMap();
      return Object.keys(profileLayoutMap).length > 0;
    }),
  })),
  withMethods((store) => ({
    setProfileLayoutMap(profileLayoutMap: ProfileLayoutMap) {
      patchState(store, (state) => ({ ...state, profileLayoutMap }));
    },
    deleteProfileLayoutMap() {
      patchState(store, (state) => ({ ...state, profileLayoutMap: {} }));
    },
  })),
);
