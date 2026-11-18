import { TestBed } from '@angular/core/testing';
import { ChordGroup } from '../models/chord.models';
import { Phase } from '../models/phase.models';
import { ChordPracticeViewStore } from './chord-practice-view.store';
import { PracticeStatisticStore } from './practice-statistic.store';

const group = (textOutput: string) => ({ textOutput }) as ChordGroup;
const GROUPS = ['a', 'b', 'c', 'd'].map(group);

describe('ChordPracticeViewStore', () => {
  let store: InstanceType<typeof ChordPracticeViewStore>;
  let statistic: InstanceType<typeof PracticeStatisticStore>;

  const front = () => store.queue()[0].textOutput;
  /** Types the text that is currently asked for. */
  const answer = (time: number, phase: Phase | null = Phase.Adaptation) =>
    store.checkText(front(), time, GROUPS, phase);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ChordPracticeViewStore] });
    store = TestBed.inject(ChordPracticeViewStore);
    statistic = TestBed.inject(PracticeStatisticStore);
  });

  it('starts empty', () => {
    expect(store.queue()).toEqual([]);
    expect(store.history()).toEqual([]);
    expect(store.lastCorrectChordTime()).toBeNull();
    expect(store.chordIntervals()).toEqual([]);
    expect(store.chpm()).toBe(0);
  });

  describe('fillQueue', () => {
    it('fills the queue with 40 chord groups from the given ones', () => {
      store.fillQueue(GROUPS);
      expect(store.queue().length).toBe(40);
      expect(store.queue().every((g) => GROUPS.includes(g))).toBe(true);
    });

    it('never asks for the same chord twice in a row', () => {
      for (let round = 0; round < 20; round++) {
        store.fillQueue(GROUPS);
        const q = store.queue().map((g) => g.textOutput);
        for (let i = 1; i < q.length; i++) {
          expect(q[i]).not.toBe(q[i - 1]);
        }
      }
    });

    it('replaces an earlier queue', () => {
      store.fillQueue(GROUPS);
      store.fillQueue([group('only')]);
      expect(store.queue().map((g) => g.textOutput)).toEqual(
        Array(40).fill('only'),
      );
    });
  });

  describe('checkText', () => {
    beforeEach(() => store.fillQueue(GROUPS));

    it('moves the answered chord from the queue to the history', () => {
      const first = store.queue()[0];
      const second = store.queue()[1];
      answer(1000);
      expect(store.queue()[0]).toBe(second);
      expect(store.queue().length).toBe(39);
      expect(store.history()).toEqual([first]);
    });

    it('ignores a wrong answer', () => {
      const before = store.queue();
      store.checkText('wrong', 1000, GROUPS, Phase.Adaptation);
      expect(store.queue()).toBe(before);
      expect(store.history()).toEqual([]);
      expect(store.lastCorrectChordTime()).toBeNull();
    });

    it('ignores spaces around the answer and the expected text', () => {
      const chordWithSpace = [group(' a ')];
      store.fillQueue(chordWithSpace);
      store.checkText('a', 1000, chordWithSpace, null);
      expect(store.history().length).toBe(1);
      store.checkText('   a', 2000, chordWithSpace, null);
      expect(store.history().length).toBe(2);
    });

    it('does not ignore the case of the answer', () => {
      const before = store.queue();
      store.checkText(front().toUpperCase(), 1000, GROUPS, null);
      expect(store.queue()).toBe(before);
    });

    describe('timing', () => {
      it('has no interval for the first correct answer, only a start time', () => {
        answer(1000);
        expect(store.lastCorrectChordTime()).toBe(1000);
        expect(store.chordIntervals()).toEqual([]);
        expect(store.chpm()).toBe(0);
      });

      it('records the time between two correct answers', () => {
        answer(1000);
        answer(1500);
        answer(2500);
        expect(store.chordIntervals()).toEqual([500, 1000]);
        expect(store.lastCorrectChordTime()).toBe(2500);
      });

      it('does not record a time for a wrong answer in between', () => {
        answer(1000);
        store.checkText('wrong', 1700, GROUPS, Phase.Adaptation);
        answer(2000);
        expect(store.chordIntervals()).toEqual([1000]);
      });

      it('starts a new interval after a pause', () => {
        answer(1000);
        store.pause();
        expect(store.lastCorrectChordTime()).toBeNull();
        answer(9000);
        expect(store.chordIntervals()).toEqual([]);
        answer(9500);
        expect(store.chordIntervals()).toEqual([500]);
      });

      it('keeps the intervals and history through a pause', () => {
        answer(1000);
        answer(1500);
        store.pause();
        expect(store.chordIntervals()).toEqual([500]);
        expect(store.history().length).toBe(2);
      });
    });

    describe('speed (chords per minute)', () => {
      it('is 0 without intervals', () => {
        expect(store.chpm()).toBe(0);
      });

      it('divides the number of intervals by their total time', () => {
        answer(1000);
        answer(2000);
        answer(3000);
        answer(4000);
        // 3 intervals of 1 second -> 60 per minute
        expect(store.chpm()).toBe(60);
      });

      it('rounds down', () => {
        answer(1000);
        answer(1700);
        // 1 interval of 0.7 seconds -> 85.7 per minute
        expect(store.chpm()).toBe(85);
      });
    });

    describe('statistics', () => {
      const countOf = (text: string) =>
        statistic.adaptation()[text]?.correctCount;

      it('are not saved for the first correct answer', () => {
        answer(1000);
        expect(statistic.adaptation()).toEqual({});
      });

      it('are saved for later correct answers of a phase', () => {
        const first = front();
        answer(1000);
        const second = front();
        answer(2000);
        expect(countOf(second)).toBe(1);
        expect(statistic.adaptation()[second].lastTenIntervals).toEqual([1000]);
        if (second !== first) {
          expect(countOf(first)).toBeUndefined();
        }
      });

      it('are saved in the phase that is given', () => {
        answer(1000, Phase.Realization);
        const second = front();
        answer(2000, Phase.Realization);
        expect(statistic.realization()[second].correctCount).toBe(1);
        expect(statistic.adaptation()).toEqual({});
      });

      it('are not saved when there is no phase', () => {
        answer(1000, null);
        answer(2000, null);
        expect(statistic.adaptation()).toEqual({});
        expect(statistic.realization()).toEqual({});
        expect(statistic.accumulation()).toEqual({});
        expect(store.chordIntervals()).toEqual([1000]);
      });
    });

    describe('refilling the queue', () => {
      const answerMany = (n: number) => {
        for (let i = 0; i < n; i++) {
          answer(1000 + i);
        }
      };

      it('does not refill while more than 20 chords are waiting', () => {
        answerMany(19); // 40 -> 21 left
        expect(store.queue().length).toBe(21);
        answer(5000); // asked with 21 waiting -> 20 left
        expect(store.queue().length).toBe(20);
      });

      it('adds 20 chords when 20 or fewer are waiting', () => {
        answerMany(20); // 20 left
        answer(5000); // asked with 20 waiting -> 19 + 20 new
        expect(store.queue().length).toBe(39);
      });

      it('does not start the new chords with the one at the end of the queue', () => {
        for (let round = 0; round < 30; round++) {
          store.fillQueue(GROUPS);
          answerMany(20);
          const lastBefore = store.queue().at(-1)!.textOutput;
          answer(5000);
          // the new chords start right after the 19 that were left
          expect(store.queue()[19].textOutput).not.toBe(lastBefore);
        }
      });

      it('keeps working with a single chord group', () => {
        store.fillQueue([group('a')]);
        for (let i = 0; i < 60; i++) {
          store.checkText('a', 1000 + i, [group('a')], null);
        }
        expect(store.history().length).toBe(60);
        expect(store.queue().length).toBeGreaterThan(0);
      });
    });

    describe('with nothing in the queue', () => {
      beforeEach(() => store.restore());

      it('ignores any entry instead of failing', () => {
        expect(() => store.checkText('a', 1000, GROUPS, null)).not.toThrow();
        expect(() =>
          store.checkText('', 1000, GROUPS, Phase.Adaptation),
        ).not.toThrow();
      });

      it('leaves the state as it is', () => {
        store.checkText('a', 1000, GROUPS, Phase.Adaptation);
        expect(store.queue()).toEqual([]);
        expect(store.history()).toEqual([]);
        expect(store.lastCorrectChordTime()).toBeNull();
        expect(statistic.adaptation()).toEqual({});
      });

      it('stays empty after filling with an empty practice set', () => {
        store.fillQueue([]);
        store.checkText('a', 1000, [], null);
        expect(store.queue()).toEqual([]);
      });
    });
  });

  describe('restore', () => {
    it('goes back to the initial state', () => {
      store.fillQueue(GROUPS);
      answer(1000);
      answer(2000);
      store.restore();
      expect(store.queue()).toEqual([]);
      expect(store.history()).toEqual([]);
      expect(store.lastCorrectChordTime()).toBeNull();
      expect(store.chordIntervals()).toEqual([]);
      expect(store.chpm()).toBe(0);
    });
  });
});
