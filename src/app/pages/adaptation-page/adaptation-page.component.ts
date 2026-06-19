import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ascend, descend, prop, sortWith } from 'ramda';
import { ChordPracticeViewComponent } from 'src/app/components/chord-practice-view/chord-practice-view.component';
import { ChordGroupWithStats } from 'src/app/models/chord.models';
import { Phase } from 'src/app/models/phase.models';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';
import { PracticeStatisticStore } from 'src/app/stores/practice-statistic.store';

@Component({
  selector: 'app-adaptation-page',
  templateUrl: 'adaptation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full',
  },
  imports: [ChordPracticeViewComponent],
})
export class AdaptationPageComponent {
  private readonly chordDataService = inject(ChordDataService);
  private readonly phaseSettingStore = inject(PhaseSettingStore);
  private readonly practiceStatisticStore = inject(PracticeStatisticStore);
  protected Phase = Phase;

  private readonly chordGroupsWithStats = computed<ChordGroupWithStats[]>(
    () => {
      const chordGroups = this.chordDataService.chordGroups();
      const practiceStatistic = this.practiceStatisticStore.adaptation();
      const { minSpeedToPass, minRepsToPass } =
        this.phaseSettingStore.adaptation();
      return chordGroups.map((cg) => {
        const statistic = practiceStatistic[cg.textOutput];
        if (!statistic) {
          return {
            ...cg,
            passed: false,
            lastTenAverageChordPerMinute: 0,
          };
        }
        const passed =
          statistic.correctCount >= minRepsToPass &&
          statistic.lastTenAverageChordPerMinute >= minSpeedToPass;
        return {
          ...cg,
          passed,
          lastTenAverageChordPerMinute: statistic.lastTenAverageChordPerMinute,
        };
      });
    },
  );

  private readonly sortedChordGroups = computed(() => {
    const chordGroups = this.chordGroupsWithStats();
    return sortWith<ChordGroupWithStats>([
      ascend(prop('passed')),
      descend(prop('bookmarked')),
      ascend(prop('englishWordRank')),
      descend(prop('lastTenAverageChordPerMinute')),
    ])(chordGroups);
  });

  public readonly practiceSet = computed(() =>
    this.sortedChordGroups().slice(
      0,
      this.phaseSettingStore.adaptation().practiceSetSize,
    ),
  );
}
