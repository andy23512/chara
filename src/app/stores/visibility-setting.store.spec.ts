import { TestBed } from '@angular/core/testing';
import { prefixStorageKey } from '../utils/store.utils';
import { VisibilitySettingStore } from './visibility-setting.store';

const stored = (key: string) => {
  TestBed.tick();
  const raw = localStorage.getItem(prefixStorageKey(key));
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  localStorage.clear();
  TestBed.configureTestingModule({});
});

describe('VisibilitySettingStore', () => {
  let store: InstanceType<typeof VisibilitySettingStore>;
  beforeEach(() => (store = TestBed.inject(VisibilitySettingStore)));

  it('shows the speedometer by default', () => {
    expect(store.speedometer()).toBe(true);
  });

  it('hides and shows a part of the screen', () => {
    store.set('speedometer', false);
    expect(store.speedometer()).toBe(false);
    store.set('speedometer', true);
    expect(store.speedometer()).toBe(true);
  });

  it('is saved to and restored from local storage', () => {
    store.set('speedometer', false);
    expect(stored('visibilitySetting').speedometer).toBe(false);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(VisibilitySettingStore).speedometer()).toBe(false);
  });

  it('fills in settings that an older save does not have', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('visibilitySetting'),
      JSON.stringify({ speedometer: false }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(VisibilitySettingStore);
    expect(restored.speedometer()).toBe(false);
  });
});
