import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { Chord, convertChordsToChordTreeNodes } from 'tangent-cc-lib';
import { flattenChordTreeNodes } from '../utils/chord.utils';
import { prefixStorageKey } from '../utils/store.utils';

const CHORD_STORE_KEY = 'chord';

export const ChordStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools(CHORD_STORE_KEY),
  withStorageSync(prefixStorageKey(CHORD_STORE_KEY)),
  withEntities<Chord>(),
  withComputed((state) => ({
    entityCount: computed(() => state.ids().length),
    flatChordTreeNodes: computed(() =>
      flattenChordTreeNodes(convertChordsToChordTreeNodes(state.entities())),
    ),
  })),
);
