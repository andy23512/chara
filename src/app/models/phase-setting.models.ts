import { Phase } from './phase.models';

export interface SinglePhaseSetting {
  practiceSetSize: number;
  minRepsToPass: number;
  minSpeedToPass: number;
}
export type PhaseSetting = Record<
  Phase.Adaptation | Phase.Realization,
  SinglePhaseSetting
>;
