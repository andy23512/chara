import { Phase } from 'src/app/models/phase.models';
import {
  createPage,
  PracticeFixture,
} from 'src/app/pages/practice-fixtures.spec';
import { AdaptationPageComponent } from './adaptation-page.component';

describe('AdaptationPageComponent', () => {
  // "the" and "and" are common English words (low rank number); "zzq" and "zzr" are not.
  const WORDS = ['zzq', 'and', 'zzr', 'the'];
  let page: PracticeFixture<AdaptationPageComponent>;
  const texts = () => page.component.practiceSet().map((g) => g.textOutput);

  beforeEach(() => {
    page = createPage(AdaptationPageComponent, WORDS);
    page.phase.set(Phase.Adaptation, 'practiceSetSize', 10);
    page.phase.set(Phase.Adaptation, 'minRepsToPass', 3);
    page.phase.set(Phase.Adaptation, 'minSpeedToPass', 60);
  });

  it('practices the most common English words first', () => {
    expect(texts().slice(0, 2)).toEqual(['the', 'and']);
    expect(texts().slice(2).sort()).toEqual(['zzq', 'zzr']);
  });

  it('takes only as many groups as the practice set size', () => {
    page.phase.set(Phase.Adaptation, 'practiceSetSize', 3);
    expect(texts()).toEqual(['the', 'and', jasmine.any(String) as never]);
  });

  it('follows changes of the practice set size', () => {
    page.phase.set(Phase.Adaptation, 'practiceSetSize', 3);
    expect(texts().length).toBe(3);
    page.phase.set(Phase.Adaptation, 'practiceSetSize', 4);
    expect(texts().length).toBe(4);
  });

  it('puts bookmarked groups before the more common words', () => {
    page.bookmark('zzr');
    expect(texts()[0]).toBe('zzr');
    expect(texts().slice(1, 3)).toEqual(['the', 'and']);
  });

  it('puts groups that have not passed before groups that have', () => {
    page.practice(Phase.Adaptation, 'the', 3); // 60 per minute, 3 times: passed
    expect(texts()).toEqual(jasmine.arrayContaining(['the']));
    expect(texts()[texts().length - 1]).toBe('the');
    expect(texts()[0]).toBe('and');
  });

  it('keeps a group that is too slow or too little practiced among the not passed', () => {
    page.practice(Phase.Adaptation, 'the', 2); // too few repetitions
    page.practice(Phase.Adaptation, 'and', 3, 3000); // too slow
    expect(texts().slice(0, 2)).toEqual(['the', 'and']);
  });

  it('practices a slower group before a faster one when the rest is equal', () => {
    page.practice(Phase.Adaptation, 'zzq', 1, 500); // 120 per minute, not passed
    page.practice(Phase.Adaptation, 'zzr', 1, 2000); // 30 per minute, not passed
    const t = texts();
    expect(t.indexOf('zzq')).toBeLessThan(t.indexOf('zzr'));
  });

  it('leaves out groups whose chords are all blocked', () => {
    page.block('the');
    expect(texts()).not.toContain('the');
    expect(texts().length).toBe(3);
  });

  it('is empty without chords', () => {
    page = createPage(AdaptationPageComponent, []);
    expect(page.component.practiceSet()).toEqual([]);
  });
});
