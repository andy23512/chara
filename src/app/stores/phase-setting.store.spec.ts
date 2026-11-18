import { TestBed } from '@angular/core/testing';
import { Phase } from '../models/phase.models';
import { prefixStorageKey } from '../utils/store.utils';
import { PhaseSettingStore } from './phase-setting.store';

const stored = (key: string) => {
  TestBed.tick();
  const raw = localStorage.getItem(prefixStorageKey(key));
  return raw === null ? null : JSON.parse(raw);
};

beforeEach(() => {
  localStorage.clear();
  TestBed.configureTestingModule({});
});

describe('PhaseSettingStore', () => {
  let store: InstanceType<typeof PhaseSettingStore>;
  beforeEach(() => (store = TestBed.inject(PhaseSettingStore)));

  it('has the default pass requirements of each phase', () => {
    expect(store.adaptation()).toEqual({
      practiceSetSize: 5,
      minRepsToPass: 50,
      minSpeedToPass: 30,
    });
    expect(store.realization()).toEqual({
      practiceSetSize: 5,
      minRepsToPass: 50,
      minSpeedToPass: 50,
    });
  });

  it('changes one value of one phase only', () => {
    store.set(Phase.Adaptation, 'minSpeedToPass', 40);
    expect(store.adaptation().minSpeedToPass).toBe(40);
    expect(store.adaptation().minRepsToPass).toBe(50);
    expect(store.realization().minSpeedToPass).toBe(50);
  });

  it('is saved to and restored from local storage', () => {
    store.set(Phase.Realization, 'practiceSetSize', 9);
    expect(stored('phaseSetting').realization.practiceSetSize).toBe(9);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(PhaseSettingStore);
    expect(restored.realization().practiceSetSize).toBe(9);
    expect(restored.adaptation().practiceSetSize).toBe(5);
  });

  it('fills in a phase that is missing from local storage', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('phaseSetting'),
      JSON.stringify({ adaptation: { practiceSetSize: 1, minRepsToPass: 2, minSpeedToPass: 3 } }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(PhaseSettingStore);
    expect(restored.adaptation().minRepsToPass).toBe(2);
    expect(restored.realization().minRepsToPass).toBe(50);
  });
});
