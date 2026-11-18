import { TestBed } from '@angular/core/testing';
import { ChordData } from '../models/chord.models';
import { prefixStorageKey } from '../utils/store.utils';
import { ChordLabelStore } from './chord-label.store';

const chord = (hash: string) => ({ actionAndPhraseHash: hash }) as ChordData;
const [A, B, C] = [chord('a'), chord('b'), chord('c')];

describe('ChordLabelStore', () => {
  let store: InstanceType<typeof ChordLabelStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(ChordLabelStore);
  });

  it('starts with nothing bookmarked or blocked', () => {
    expect(store.bookmarkedHashes()).toEqual([]);
    expect(store.blockedHashes()).toEqual([]);
    expect(store.bookmarkedHashSet().size).toBe(0);
    expect(store.blockedHashSet().size).toBe(0);
  });

  describe('bookmarks', () => {
    it('bookmarks one chord or several chords', () => {
      store.bookmarkChord(A);
      store.bookmarkChords([B, C]);
      expect(store.bookmarkedHashes()).toEqual(['a', 'b', 'c']);
    });

    it('removes one bookmark', () => {
      store.bookmarkChords([A, B, C]);
      store.unbookmarkChord(B);
      expect(store.bookmarkedHashes()).toEqual(['a', 'c']);
    });

    it('removes several bookmarks', () => {
      store.bookmarkChords([A, B, C]);
      store.unbookmarkChords([A, C]);
      expect(store.bookmarkedHashes()).toEqual(['b']);
    });

    it('ignores removing a chord that is not bookmarked', () => {
      store.bookmarkChord(A);
      store.unbookmarkChord(B);
      store.unbookmarkChords([B, C]);
      expect(store.bookmarkedHashes()).toEqual(['a']);
    });

    // Current behavior: bookmarking twice stores the hash twice, and a single
    // unbookmark removes every copy.
    it('stores a hash twice when bookmarked twice, and removes both copies at once', () => {
      store.bookmarkChord(A);
      store.bookmarkChord(A);
      expect(store.bookmarkedHashes()).toEqual(['a', 'a']);
      expect(store.bookmarkedHashSet().size).toBe(1);
      store.unbookmarkChord(A);
      expect(store.bookmarkedHashes()).toEqual([]);
    });

    it('does not touch the blocked chords', () => {
      store.blockChord(A);
      store.bookmarkChord(B);
      store.unbookmarkChord(B);
      expect(store.blockedHashes()).toEqual(['a']);
    });
  });

  describe('blocks', () => {
    it('blocks one chord or several chords', () => {
      store.blockChord(A);
      store.blockChords([B, C]);
      expect(store.blockedHashes()).toEqual(['a', 'b', 'c']);
    });

    it('removes one block', () => {
      store.blockChords([A, B, C]);
      store.unblockChord(B);
      expect(store.blockedHashes()).toEqual(['a', 'c']);
    });

    it('does not touch the bookmarked chords', () => {
      store.bookmarkChord(A);
      store.blockChord(B);
      store.unblockChord(B);
      expect(store.bookmarkedHashes()).toEqual(['a']);
    });

    it('unblockChords removes only the given chords from the blocked list', () => {
      store.blockChords([A, B, C]);
      store.unblockChords([A, C]);
      expect(store.blockedHashes()).toEqual(['b']);
    });

    it('unblockChords does not use the bookmarked list', () => {
      store.blockChords([A, B, C]);
      store.bookmarkChord(C);
      store.unblockChords([A]);
      expect(store.blockedHashes()).toEqual(['b', 'c']);
      expect(store.bookmarkedHashes()).toEqual(['c']);
    });
  });

  describe('hash sets', () => {
    it('follow the lists', () => {
      store.bookmarkChords([A, B]);
      store.blockChord(C);
      expect([...store.bookmarkedHashSet()]).toEqual(['a', 'b']);
      expect([...store.blockedHashSet()]).toEqual(['c']);
    });
  });

  it('is saved to local storage', () => {
    store.bookmarkChord(A);
    store.blockChord(B);
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem(prefixStorageKey('chordLabel'))!)).toEqual({
      bookmarkedHashes: ['a'],
      blockedHashes: ['b'],
    });
  });

  it('is restored from local storage', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('chordLabel'),
      JSON.stringify({ bookmarkedHashes: ['x'] }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ChordLabelStore);
    expect(restored.bookmarkedHashes()).toEqual(['x']);
    expect(restored.blockedHashes()).toEqual([]);
  });
});
