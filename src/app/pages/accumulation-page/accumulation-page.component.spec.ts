import { Phase } from 'src/app/models/phase.models';
import { createPage, PracticeFixture } from '../practice-fixtures.spec';
import { AccumulationPageComponent } from './accumulation-page.component';

describe('AccumulationPageComponent', () => {
  let page: PracticeFixture<AccumulationPageComponent>;
  const texts = () => page.component.practiceSet().map((g) => g.textOutput);
  const passRealization = (word: string) =>
    page.practice(Phase.Realization, word, 2);

  function setup(words: string[]) {
    page = createPage(AccumulationPageComponent, words);
    page.phase.set(Phase.Realization, 'minRepsToPass', 2);
    page.phase.set(Phase.Realization, 'minSpeedToPass', 60);
  }

  it('is empty until a group has passed realization', () => {
    setup(['the', 'and']);
    page.practice(Phase.Adaptation, 'the', 100);
    expect(texts()).toEqual([]);
  });

  it('only practices groups that passed realization', () => {
    setup(['the', 'and', 'zzq']);
    passRealization('the');
    passRealization('zzq');
    expect(texts().sort()).toEqual(['the', 'zzq']);
  });

  it('does not take groups that were too slow in realization', () => {
    setup(['the', 'and']);
    page.practice(Phase.Realization, 'the', 2, 3000);
    expect(texts()).toEqual([]);
  });

  it('practices the group with the fewest accumulation entries first', () => {
    setup(['the', 'and', 'zzq']);
    ['the', 'and', 'zzq'].forEach(passRealization);
    page.practice(Phase.Accumulation, 'the', 5);
    page.practice(Phase.Accumulation, 'and', 1);
    // zzq has no accumulation records, which counts as 0
    expect(texts()).toEqual(['zzq', 'and', 'the']);
  });

  it('takes at most 10 groups', () => {
    const words = Array.from(
      { length: 12 },
      (_, i) => `zz${String.fromCharCode(97 + i)}`,
    );
    setup(words);
    words.forEach(passRealization);
    expect(texts().length).toBe(10);
  });

  it('leaves out the most practiced groups when there are more than 10', () => {
    const words = Array.from(
      { length: 12 },
      (_, i) => `zz${String.fromCharCode(97 + i)}`,
    );
    setup(words);
    words.forEach(passRealization);
    page.practice(Phase.Accumulation, 'zza', 4);
    page.practice(Phase.Accumulation, 'zzb', 3);
    expect(texts()).not.toContain('zza');
    expect(texts()).not.toContain('zzb');
  });

  it('leaves out blocked groups', () => {
    setup(['the', 'and']);
    passRealization('the');
    passRealization('and');
    page.block('and');
    expect(texts()).toEqual(['the']);
  });
});
