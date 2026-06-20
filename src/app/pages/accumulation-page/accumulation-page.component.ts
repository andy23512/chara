import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ascend, prop, sortWith } from 'ramda';
import { ChordPracticeViewComponent } from 'src/app/components/chord-practice-view/chord-practice-view.component';
import {
  ChordGroup,
  ChordGroupWithCorrectCount,
} from 'src/app/models/chord.models';
import { Phase } from 'src/app/models/phase.models';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';
import { PracticeStatisticStore } from 'src/app/stores/practice-statistic.store';
import { shuffle } from 'src/app/utils/random.utils';

@UntilDestroy()
@Component({
  selector: 'app-accumulation-page',
  templateUrl: 'accumulation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full',
  },
  imports: [ChordPracticeViewComponent],
})
export class AccumulationPageComponent {
  private readonly chordDataService = inject(ChordDataService);
  private readonly phaseSettingStore = inject(PhaseSettingStore);
  private readonly practiceStatisticStore = inject(PracticeStatisticStore);
  protected Phase = Phase;

  private readonly chordGroups = computed<ChordGroup[]>(() => {
    const chordGroups = this.chordDataService.chordGroups();
    const realizationPracticeStatistic =
      this.practiceStatisticStore.realization();
    const { minSpeedToPass, minRepsToPass } =
      this.phaseSettingStore.realization();
    return chordGroups.filter((cg) => {
      const s = realizationPracticeStatistic[cg.textOutput];
      return (
        s &&
        s.correctCount >= minRepsToPass &&
        s.lastTenAverageChordPerMinute >= minSpeedToPass
      );
    });
  });

  private readonly chordGroupsWithCorrectCount = computed<
    ChordGroupWithCorrectCount[]
  >(() => {
    const chordGroups = this.chordGroups();
    const practiceStatistic = this.practiceStatisticStore.accumulation();
    return chordGroups.map((cg) => {
      const statistic = practiceStatistic[cg.textOutput];
      return {
        ...cg,
        correctCount: statistic?.correctCount ?? 0,
      };
    });
  });

  private readonly sortedChordGroups = computed(() => {
    const chordGroups = this.chordGroupsWithCorrectCount();
    return sortWith<ChordGroupWithCorrectCount>([ascend(prop('correctCount'))])(
      shuffle(chordGroups),
    );
  });

  public readonly practiceSet = computed(() =>
    this.sortedChordGroups().slice(0, 10),
  );
}
