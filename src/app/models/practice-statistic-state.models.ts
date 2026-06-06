import { Phase } from './phase.models';

export type ChordPracticeStatistic = {
  lastTenIntervals: number[];
  lastTenAverageChordPerMinute: number;
  correctCount: number;
};
export type PracticeStatisticState = Record<
  Phase,
  Record<string, ChordPracticeStatistic>
>;
