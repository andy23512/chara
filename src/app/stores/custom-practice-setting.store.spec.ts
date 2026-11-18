import { TestBed } from '@angular/core/testing';
import { prefixStorageKey } from '../utils/store.utils';
import { CustomPracticeSettingStore } from './custom-practice-setting.store';

const stored = (key: string) => {
  TestBed.tick();
  const raw = localStorage.getItem(prefixStorageKey(key));
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  localStorage.clear();
  TestBed.configureTestingModule({});
});

describe('CustomPracticeSettingStore', () => {
  let store: InstanceType<typeof CustomPracticeSettingStore>;
  beforeEach(() => (store = TestBed.inject(CustomPracticeSettingStore)));

  it('shows hints after a timeout by default', () => {
    expect(store.hintDisplayMode()).toBe('timeout');
  });

  it('changes the hint display mode', () => {
    store.set('hintDisplayMode', 'always');
    expect(store.hintDisplayMode()).toBe('always');
  });

  it('is saved to and restored from local storage', () => {
    store.set('hintDisplayMode', 'always');
    expect(stored('customPracticeSetting')).toEqual({
      hintDisplayMode: 'always',
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(
      TestBed.inject(CustomPracticeSettingStore).hintDisplayMode(),
    ).toBe('always');
  });
});
