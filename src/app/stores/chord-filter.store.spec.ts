import { TestBed } from '@angular/core/testing';
import { ChordFilterStore } from './chord-filter.store';

beforeEach(() => {
  localStorage.clear();
  TestBed.configureTestingModule({});
});

describe('ChordFilterStore', () => {
  let store: InstanceType<typeof ChordFilterStore>;
  beforeEach(() => (store = TestBed.inject(ChordFilterStore)));

  it('starts with every filter off', () => {
    expect(store.searchQuery()).toBe('');
    expect(store.bookmarkFilter()).toBe('all');
    expect(store.blockFilter()).toBe('all');
    expect(store.dynamicLibraryFilter()).toBe('all');
    expect(store.hasActiveSelectionFilters()).toBe(false);
    expect(store.hasActiveSearchFilter()).toBe(false);
  });

  it('sets each filter on its own', () => {
    store.setSearchQuery('abc');
    store.setBookmarkFilter('bookmarked');
    store.setBlockFilter('blocked');
    store.setDynamicLibraryFilter('lib');
    expect([
      store.searchQuery(),
      store.bookmarkFilter(),
      store.blockFilter(),
      store.dynamicLibraryFilter(),
    ]).toEqual(['abc', 'bookmarked', 'blocked', 'lib']);
  });

  describe('hasActiveSelectionFilters', () => {
    it('is true when only the bookmark filter is set', () => {
      store.setBookmarkFilter('unbookmarked');
      expect(store.hasActiveSelectionFilters()).toBe(true);
    });

    it('is true when only the block filter is set', () => {
      store.setBlockFilter('unblocked');
      expect(store.hasActiveSelectionFilters()).toBe(true);
    });

    it('is true when only the dynamic library filter is set', () => {
      store.setDynamicLibraryFilter('some-hash');
      expect(store.hasActiveSelectionFilters()).toBe(true);
    });

    it('does not count the search query', () => {
      store.setSearchQuery('abc');
      expect(store.hasActiveSelectionFilters()).toBe(false);
    });

    it('goes back to false when the filters are cleared', () => {
      store.setBlockFilter('blocked');
      store.setBlockFilter('all');
      expect(store.hasActiveSelectionFilters()).toBe(false);
    });
  });

  describe('hasActiveSearchFilter', () => {
    it('is true for a query with text', () => {
      store.setSearchQuery('abc');
      expect(store.hasActiveSearchFilter()).toBe(true);
    });

    it('ignores a query of only whitespace', () => {
      store.setSearchQuery('   ');
      expect(store.hasActiveSearchFilter()).toBe(false);
    });

    it('does not count the selection filters', () => {
      store.setBookmarkFilter('bookmarked');
      expect(store.hasActiveSearchFilter()).toBe(false);
    });
  });

  it('is not saved to local storage', () => {
    store.setSearchQuery('abc');
    TestBed.tick();
    expect(localStorage.length).toBe(0);
  });
});
