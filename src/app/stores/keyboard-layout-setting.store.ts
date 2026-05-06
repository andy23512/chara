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
import {
  CHINESE_KEYBOARD_LAYOUTS,
  KEYBOARD_LAYOUTS_FROM_KBDLAYOUT,
  KEYBOARD_LAYOUTS_FROM_XKEYBOARD,
  KeyboardLayout,
} from 'tangent-cc-lib';
import { prefixStorageKey } from '../utils/store.utils';

export const KeyboardLayoutSettingStore = signalStore(
  { providedIn: 'root' },
  withDevtools('keyboardLayoutSetting'),
  withStorageSync(prefixStorageKey('keyboardLayoutSetting')),
  withState({
    selectedId: 'us',
  }),
  withMethods((store) => ({
    setSelectedId(selectedId: string) {
      patchState(store, (state) => ({
        ...state,
        selectedId,
      }));
    },
  })),
  withComputed(() => ({
    entities: computed(() => [
      ...KEYBOARD_LAYOUTS_FROM_KBDLAYOUT,
      ...KEYBOARD_LAYOUTS_FROM_XKEYBOARD,
      ...CHINESE_KEYBOARD_LAYOUTS,
    ]),
  })),
  withComputed((state) => ({
    selectedEntity: computed(() => {
      const selectedId = state.selectedId();
      return state
        .entities()
        .find((layout) => layout.id === selectedId) as KeyboardLayout;
    }),
  })),
);
