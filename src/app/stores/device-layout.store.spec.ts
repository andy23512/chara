import { TestBed } from '@angular/core/testing';
import { Profile, ProfileLayoutMap } from 'tangent-cc-lib';
import { prefixStorageKey } from '../utils/store.utils';
import { DeviceLayoutStore } from './device-layout.store';

const layoutMap = { [Profile.A]: [[1, 2, 3]] } as unknown as ProfileLayoutMap;

describe('DeviceLayoutStore', () => {
  let store: InstanceType<typeof DeviceLayoutStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(DeviceLayoutStore);
  });

  it('starts with no layout loaded', () => {
    expect(store.profileLayoutMap()).toEqual({});
    expect(store.hasLoadedProfileLayoutMap()).toBe(false);
  });

  it('keeps the layout map it is given', () => {
    store.setProfileLayoutMap(layoutMap);
    expect(store.profileLayoutMap()).toEqual(layoutMap);
    expect(store.hasLoadedProfileLayoutMap()).toBe(true);
  });

  it('forgets the layout map when it is deleted', () => {
    store.setProfileLayoutMap(layoutMap);
    store.deleteProfileLayoutMap();
    expect(store.profileLayoutMap()).toEqual({});
    expect(store.hasLoadedProfileLayoutMap()).toBe(false);
  });

  it('replaces the layout map instead of merging', () => {
    store.setProfileLayoutMap(layoutMap);
    store.setProfileLayoutMap({ [Profile.B]: [[9]] } as unknown as ProfileLayoutMap);
    expect(Object.keys(store.profileLayoutMap())).toEqual(['B']);
  });

  it('is saved to and restored from local storage', () => {
    store.setProfileLayoutMap(layoutMap);
    TestBed.tick();
    expect(
      JSON.parse(localStorage.getItem(prefixStorageKey('deviceLayout'))!),
    ).toEqual({ profileLayoutMap: layoutMap });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(DeviceLayoutStore);
    expect(restored.hasLoadedProfileLayoutMap()).toBe(true);
  });
});
