import { TestBed } from '@angular/core/testing';
import { ChordGroup } from '../models/chord.models';
import { Phase } from '../models/phase.models';
import { prefixStorageKey } from '../utils/store.utils';
import { PracticeStatisticStore } from './practice-statistic.store';

const group = (textOutput: string) => ({ textOutput }) as ChordGroup;

describe('PracticeStatisticStore', () => {
  let store: InstanceType<typeof PracticeStatisticStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(PracticeStatisticStore);
  });

  it('starts with no records in any phase', () => {
    expect(store.adaptation()).toEqual({});
    expect(store.realization()).toEqual({});
    expect(store.accumulation()).toEqual({});
  });

  describe('saveSpeedRecord', () => {
    it('creates a record from the first interval', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
      expect(store.adaptation()['the']).toEqual({
        lastTenIntervals: [1000],
        lastTenAverageChordPerMinute: 60, // one chord per second
        correctCount: 1,
      });
    });

    it('counts every correct answer', () => {
      for (let i = 0; i < 5; i++) {
        store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
      }
      expect(store.adaptation()['the'].correctCount).toBe(5);
    });

    it('averages over the intervals so far', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 3000);
      // 2 chords in 4 seconds -> 30 per minute
      expect(store.adaptation()['the'].lastTenAverageChordPerMinute).toBe(30);
    });

    it('rounds the speed down', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 700);
      // 60000 / 700 = 85.7
      expect(store.adaptation()['the'].lastTenAverageChordPerMinute).toBe(85);
    });

    it('keeps only the last ten intervals for the speed, but counts all answers', () => {
      for (let i = 1; i <= 12; i++) {
        store.saveSpeedRecord(Phase.Adaptation, group('the'), i * 100);
      }
      const record = store.adaptation()['the'];
      expect(record.lastTenIntervals).toEqual([
        300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200,
      ]);
      expect(record.correctCount).toBe(12);
      // 10 chords in 7.5 seconds -> 80 per minute
      expect(record.lastTenAverageChordPerMinute).toBe(80);
    });

    it('records a speed of 0 when the intervals add up to 0', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 0);
      expect(store.adaptation()['the'].lastTenAverageChordPerMinute).toBe(0);
      expect(store.adaptation()['the'].correctCount).toBe(1);
    });

    it('keeps the words apart', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
      store.saveSpeedRecord(Phase.Adaptation, group('of'), 2000);
      expect(Object.keys(store.adaptation()).sort()).toEqual(['of', 'the']);
      expect(store.adaptation()['of'].lastTenIntervals).toEqual([2000]);
    });

    it('keeps the phases apart', () => {
      store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
      store.saveSpeedRecord(Phase.Realization, group('the'), 2000);
      store.saveSpeedRecord(Phase.Accumulation, group('the'), 3000);
      expect(store.adaptation()['the'].lastTenIntervals).toEqual([1000]);
      expect(store.realization()['the'].lastTenIntervals).toEqual([2000]);
      expect(store.accumulation()['the'].lastTenIntervals).toEqual([3000]);
    });
  });

  it('is saved to local storage', () => {
    store.saveSpeedRecord(Phase.Adaptation, group('the'), 1000);
    TestBed.tick();
    const saved = JSON.parse(
      localStorage.getItem(prefixStorageKey('practiceStatistic'))!,
    );
    expect(saved.adaptation['the'].correctCount).toBe(1);
  });

  it('is restored from local storage, filling in missing phases', () => {
    TestBed.resetTestingModule();
    localStorage.setItem(
      prefixStorageKey('practiceStatistic'),
      JSON.stringify({
        adaptation: {
          the: { lastTenIntervals: [1000], lastTenAverageChordPerMinute: 60, correctCount: 4 },
        },
      }),
    );
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(PracticeStatisticStore);
    expect(restored.adaptation()['the'].correctCount).toBe(4);
    expect(restored.realization()).toEqual({});
    expect(restored.accumulation()).toEqual({});
  });
});
