import { Phase } from 'src/app/models/phase.models';
import { createPage, PracticeFixture } from '../practice-fixtures.spec';
import { RealizationPageComponent } from './realization-page.component';

describe('RealizationPageComponent', () => {
  const WORDS = ['zzq', 'and', 'zzr', 'the'];
  let page: PracticeFixture<RealizationPageComponent>;
  const texts = () => page.component.practiceSet().map((g) => g.textOutput);
  const passAdaptation = (...words: string[]) =>
    words.forEach((w) => page.practice(Phase.Adaptation, w, 3));

  beforeEach(() => {
    page = createPage(RealizationPageComponent, WORDS);
    page.phase.set(Phase.Adaptation, 'minRepsToPass', 3);
    page.phase.set(Phase.Adaptation, 'minSpeedToPass', 60);
    page.phase.set(Phase.Realization, 'practiceSetSize', 10);
    page.phase.set(Phase.Realization, 'minRepsToPass', 2);
    page.phase.set(Phase.Realization, 'minSpeedToPass', 60);
  });

  it('is empty until a group has passed adaptation', () => {
    expect(texts()).toEqual([]);
  });

  it('only practices groups that passed adaptation', () => {
    passAdaptation('and', 'zzq');
    expect(texts().sort()).toEqual(['and', 'zzq']);
  });

  it('does not take groups that practiced too little or too slowly in adaptation', () => {
    page.practice(Phase.Adaptation, 'the', 2);
    page.practice(Phase.Adaptation, 'and', 3, 3000);
    expect(texts()).toEqual([]);
  });

  it('practices groups that have not passed realization before those that have', () => {
    passAdaptation('and', 'the');
    page.practice(Phase.Realization, 'the', 2); // passed realization
    expect(texts()).toEqual(['and', 'the']);
  });

  it('judges realization by its own pass requirements', () => {
    passAdaptation('and', 'the');
    page.practice(Phase.Realization, 'the', 2, 3000); // too slow for realization
    expect(texts()).toEqual(['the', 'and']);
  });

  it('does not count a group as passed in realization with too few repetitions', () => {
    passAdaptation('and', 'the');
    page.practice(Phase.Realization, 'the', 1); // fast, but the requirement is 2
    expect(texts()).toEqual(['the', 'and']);
  });

  it('puts bookmarked groups first and then the common words', () => {
    passAdaptation('and', 'the', 'zzq', 'zzr');
    page.bookmark('zzr');
    expect(texts()[0]).toBe('zzr');
    expect(texts().slice(1, 3)).toEqual(['the', 'and']);
  });

  it('takes only as many groups as the practice set size', () => {
    passAdaptation('and', 'the', 'zzq', 'zzr');
    page.phase.set(Phase.Realization, 'practiceSetSize', 3);
    expect(texts().length).toBe(3);
  });

  it('leaves out blocked groups', () => {
    passAdaptation('and', 'the');
    page.block('the');
    expect(texts()).toEqual(['and']);
  });
});
