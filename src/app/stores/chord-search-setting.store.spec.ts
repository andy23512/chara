import { TestBed } from '@angular/core/testing';
import { prefixStorageKey } from '../utils/store.utils';
import { ChordSearchSettingStore } from './chord-search-setting.store';

const stored = (key: string) => {
  TestBed.tick();
  const raw = localStorage.getItem(prefixStorageKey(key));
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  localStorage.clear();
  TestBed.configureTestingModule({});
});

describe('ChordSearchSettingStore', () => {
  let store: InstanceType<typeof ChordSearchSettingStore>;
  beforeEach(() => (store = TestBed.inject(ChordSearchSettingStore)));

  it('searches both the input and the output by default', () => {
    expect(store.chordInput()).toBe(true);
    expect(store.chordOutput()).toBe(true);
    expect(store.onlyOneEnabled()).toBe(false);
  });

  it('sets one option without touching the other', () => {
    store.set('chordInput', false);
    expect(store.chordInput()).toBe(false);
    expect(store.chordOutput()).toBe(true);
  });

  describe('onlyOneEnabled', () => {
    it('is true when only the input is enabled', () => {
      store.set('chordOutput', false);
      expect(store.onlyOneEnabled()).toBe(true);
    });

    it('is true when only the output is enabled', () => {
      store.set('chordInput', false);
      expect(store.onlyOneEnabled()).toBe(true);
    });

    it('is false when both are disabled', () => {
      store.set('chordInput', false);
      store.set('chordOutput', false);
      expect(store.onlyOneEnabled()).toBe(false);
    });
  });

  it('is saved to local storage', () => {
    store.set('chordOutput', false);
    expect(stored('chordSearchSetting')).toEqual(
      jasmine.objectContaining({ chordInput: true, chordOutput: false }),
    );
  });

  it('is restored from local storage, filling in missing options', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('chordSearchSetting'),
      JSON.stringify({ chordInput: false }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ChordSearchSettingStore);
    expect(restored.chordInput()).toBe(false);
    expect(restored.chordOutput()).toBe(true);
  });
});
