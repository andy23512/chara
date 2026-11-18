import { TestBed } from '@angular/core/testing';
import { Phase } from '../models/phase.models';
import { prefixStorageKey } from '../utils/store.utils';
import {
  MIN_PRACTICE_SET_SIZE,
  normalizePracticeSetSize,
  PhaseSettingStore,
} from './phase-setting.store';

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
      JSON.stringify({
        adaptation: { practiceSetSize: 4, minRepsToPass: 2, minSpeedToPass: 3 },
      }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(PhaseSettingStore);
    expect(restored.adaptation()).toEqual({
      practiceSetSize: 4,
      minRepsToPass: 2,
      minSpeedToPass: 3,
    });
    expect(restored.realization().minRepsToPass).toBe(50);
  });

  it('fills in the values that are missing inside a saved phase', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('phaseSetting'),
      JSON.stringify({ adaptation: { minRepsToPass: 7 } }),
    );
    TestBed.configureTestingModule({});
    expect(TestBed.inject(PhaseSettingStore).adaptation()).toEqual({
      practiceSetSize: 5,
      minRepsToPass: 7,
      minSpeedToPass: 30,
    });
  });

  describe('a saved practice set size that is too small', () => {
    const restoreWith = (size: unknown) => {
      TestBed.resetTestingModule();
      localStorage.setItem(
        prefixStorageKey('phaseSetting'),
        JSON.stringify({
          adaptation: {
            practiceSetSize: size,
            minRepsToPass: 1,
            minSpeedToPass: 1,
          },
          realization: {
            practiceSetSize: size,
            minRepsToPass: 1,
            minSpeedToPass: 1,
          },
        }),
      );
      TestBed.configureTestingModule({});
      return TestBed.inject(PhaseSettingStore);
    };

    it('is raised to the minimum when restored, in both phases', () => {
      const restored = restoreWith(0);
      expect(restored.adaptation().practiceSetSize).toBe(MIN_PRACTICE_SET_SIZE);
      expect(restored.realization().practiceSetSize).toBe(
        MIN_PRACTICE_SET_SIZE,
      );
    });

    it('is replaced by the minimum when it is saved as null', () => {
      expect(restoreWith(null).adaptation().practiceSetSize).toBe(
        MIN_PRACTICE_SET_SIZE,
      );
    });

    it('keeps a size that is large enough', () => {
      expect(
        restoreWith(MIN_PRACTICE_SET_SIZE).adaptation().practiceSetSize,
      ).toBe(MIN_PRACTICE_SET_SIZE);
      expect(restoreWith(12).adaptation().practiceSetSize).toBe(12);
    });

    it('does not change the other settings of the phase', () => {
      const restored = restoreWith(0);
      expect(restored.adaptation().minRepsToPass).toBe(1);
      expect(restored.adaptation().minSpeedToPass).toBe(1);
    });
  });

  it('keeps what is typed while typing, and only corrects it later (set does not clamp)', () => {
    store.set(Phase.Adaptation, 'practiceSetSize', 1);
    expect(store.adaptation().practiceSetSize).toBe(1);
  });
});

describe('normalizePracticeSetSize', () => {
  it('uses 3 as the minimum', () => {
    expect(MIN_PRACTICE_SET_SIZE).toBe(3);
  });

  it('raises sizes below the minimum', () => {
    for (const size of [-5, 0, 1, 2]) {
      expect(normalizePracticeSetSize(size)).toBe(3);
    }
  });

  it('keeps sizes at or above the minimum', () => {
    expect(normalizePracticeSetSize(3)).toBe(3);
    expect(normalizePracticeSetSize(4)).toBe(4);
    expect(normalizePracticeSetSize(100)).toBe(100);
  });

  it('rounds a fractional size down', () => {
    expect(normalizePracticeSetSize(7.9)).toBe(7);
    expect(normalizePracticeSetSize(3.9)).toBe(3);
    expect(normalizePracticeSetSize(2.9)).toBe(3);
  });

  it('uses the minimum for values that are not numbers', () => {
    for (const value of [null, undefined, NaN, Infinity, '8', {}]) {
      expect(normalizePracticeSetSize(value)).toBe(3);
    }
  });
});
