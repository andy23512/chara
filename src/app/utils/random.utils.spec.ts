import { pickRandomItemNTimes, shuffle } from './random.utils';

describe('random utils', () => {
  describe('shuffle', () => {
    it('keeps all the items', () => {
      const list = [1, 2, 3, 4, 5, 6, 7, 8];
      expect([...shuffle(list)].sort()).toEqual(list);
    });

    it('does not change the input list', () => {
      const list = [1, 2, 3, 4, 5];
      shuffle(list);
      expect(list).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns a new list', () => {
      const list = [1, 2, 3];
      expect(shuffle(list)).not.toBe(list);
    });

    it('handles empty and single item lists', () => {
      expect(shuffle([])).toEqual([]);
      expect(shuffle([7])).toEqual([7]);
    });

    it('can produce an order other than the original', () => {
      const list = Array.from({ length: 20 }, (_, i) => i);
      const moved = Array.from({ length: 10 }, () => shuffle(list)).some(
        (s) => s.join() !== list.join(),
      );
      expect(moved).toBe(true);
    });

    it('is driven by Math.random (reverses the list when it always returns 0)', () => {
      spyOn(Math, 'random').and.returnValue(0);
      // each step swaps the last remaining item with the first one
      expect(shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
    });
  });

  describe('pickRandomItemNTimes', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];

    it('returns n items from the list', () => {
      const picks = pickRandomItemNTimes(list, 20);
      expect(picks.length).toBe(20);
      expect(picks.every((p) => list.includes(p))).toBe(true);
    });

    it('never picks the same item twice in a row', () => {
      for (let round = 0; round < 50; round++) {
        const picks = pickRandomItemNTimes(list, 30);
        for (let i = 1; i < picks.length; i++) {
          expect(picks[i]).not.toBe(picks[i - 1]);
        }
      }
    });

    it('does not start with the item at the previous index', () => {
      for (let round = 0; round < 100; round++) {
        expect(pickRandomItemNTimes(list, 5, 2)[0]).not.toBe('c');
      }
    });

    it('can start with any item when there is no previous index', () => {
      const firsts = new Set(
        Array.from({ length: 300 }, () => pickRandomItemNTimes(list, 1)[0]),
      );
      expect(firsts.size).toBe(list.length);
    });

    it('returns an empty list when n is 0', () => {
      expect(pickRandomItemNTimes(list, 0)).toEqual([]);
    });

    it('repeats the only item when the list has one item', () => {
      expect(pickRandomItemNTimes(['x'], 3)).toEqual(['x', 'x', 'x']);
      expect(pickRandomItemNTimes(['x'], 3, 0)).toEqual(['x', 'x', 'x']);
    });

    it('alternates between the two items of a two item list', () => {
      const picks = pickRandomItemNTimes(['x', 'y'], 6, 0);
      expect(picks).toEqual(['y', 'x', 'y', 'x', 'y', 'x']);
    });

    // Current behavior: an empty list has min = 0 and max = -1, so the
    // generator never finds a valid index and returns undefined items.
    it('returns undefined items for an empty list', () => {
      spyOn(Math, 'random').and.returnValues(0.5, 0.6, 0.7);
      const picks = pickRandomItemNTimes([] as string[], 3);
      expect(picks).toEqual([undefined, undefined, undefined] as never);
    });
  });
});
