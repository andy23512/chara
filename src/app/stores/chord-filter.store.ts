import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { BlockFilter, BookmarkFilter } from '../models/filter.models';

interface ChordFilterState {
  searchQuery: string;
  bookmarkFilter: BookmarkFilter;
  blockFilter: BlockFilter;
  dynamicLibraryFilter: string;
}

const INITIAL_CHORD_FILTER_STATE: ChordFilterState = {
  searchQuery: '',
  bookmarkFilter: 'all',
  blockFilter: 'all',
  dynamicLibraryFilter: 'all',
};

export const ChordFilterStore = signalStore(
  { providedIn: 'root' },
  withState(INITIAL_CHORD_FILTER_STATE),
  withMethods((store) => ({
    setSearchQuery(searchQuery: string) {
      patchState(store, { searchQuery });
    },
    setBookmarkFilter(bookmarkFilter: BookmarkFilter) {
      patchState(store, { bookmarkFilter });
    },
    setBlockFilter(blockFilter: BlockFilter) {
      patchState(store, { blockFilter });
    },
    setDynamicLibraryFilter(dynamicLibraryFilter: string) {
      patchState(store, { dynamicLibraryFilter });
    },
  })),
  withComputed((state) => ({
    hasActiveSelectionFilters: computed(
      () =>
        state.bookmarkFilter() !== 'all' ||
        state.blockFilter() !== 'all' ||
        state.dynamicLibraryFilter() !== 'all',
    ),
    hasActiveSearchFilter: computed(() => state.searchQuery().trim() !== ''),
  })),
);
