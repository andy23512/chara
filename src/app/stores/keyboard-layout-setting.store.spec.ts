import { TestBed } from '@angular/core/testing';
import { prefixStorageKey } from '../utils/store.utils';
import { KeyboardLayoutSettingStore } from './keyboard-layout-setting.store';

describe('KeyboardLayoutSettingStore', () => {
  let store: InstanceType<typeof KeyboardLayoutSettingStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(KeyboardLayoutSettingStore);
  });

  it('selects the US layout by default', () => {
    expect(store.selectedId()).toBe('us');
    expect(store.selectedEntity().id).toBe('us');
  });

  it('offers a long list of layouts, including the US one', () => {
    expect(store.entities().length).toBeGreaterThan(100);
    expect(store.entities().some((l) => l.id === 'us')).toBe(true);
  });

  it('has a name and key map for every layout', () => {
    for (const layout of store.entities()) {
      expect(layout.id).toEqual(jasmine.any(String));
      expect(layout.name).toEqual(jasmine.any(String));
      expect(layout.layout).toEqual(jasmine.any(Object));
    }
  });

  it('selects another layout', () => {
    const other = store.entities().find((l) => l.id !== 'us')!;
    store.setSelectedId(other.id);
    expect(store.selectedEntity()).toBe(other);
  });

  // Current behavior: the type says a layout is always selected, but an id
  // that is not in the list gives undefined.
  it('gives undefined for an id that is not in the list', () => {
    store.setSelectedId('no-such-layout');
    expect(store.selectedEntity()).toBeUndefined();
  });

  it('is saved to and restored from local storage', () => {
    const other = store.entities().find((l) => l.id !== 'us')!;
    store.setSelectedId(other.id);
    TestBed.tick();
    expect(
      JSON.parse(localStorage.getItem(prefixStorageKey('keyboardLayoutSetting'))!),
    ).toEqual({ selectedId: other.id });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(KeyboardLayoutSettingStore).selectedId()).toBe(other.id);
  });
});
