import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

interface ChordFilterState {
  searchQuery: string;
}

const INITIAL_CHORD_FILTER_STATE: ChordFilterState = {
  searchQuery: '',
};

export const ChordFilterStore = signalStore(
  { providedIn: 'root' },
  withState(INITIAL_CHORD_FILTER_STATE),
  withMethods((store) => ({
    setSearchQuery(searchQuery: string) {
      patchState(store, { searchQuery });
    },
  })),
);
