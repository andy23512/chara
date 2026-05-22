import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import { signalStore, withComputed } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { ChordTreeNode } from 'tangent-cc-lib';
import { prefixStorageKey } from '../utils/store.utils';

export const FlatChordTreeNodeStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools('flatChordTreeNode'),
  withStorageSync(prefixStorageKey('flatChordTreeNode')),
  withEntities<ChordTreeNode>(),
  withComputed((state) => ({
    entityCount: computed(() => state.ids().length),
  })),
);
