import { computed, inject, Injectable } from '@angular/core';
import { ascend, groupBy, path, prop, sortWith, toPairs } from 'ramda';
import { ENGLISH_WORD_RANK_MAP } from '../data/english-word-rank';
import {
  ChordDataWithLabelStateAndStatistic,
  ChordGroup,
} from '../models/chord.models';
import { ChordLabelStore } from '../stores/chord-label.store';
import { ChordStore } from '../stores/chord.store';
import { KeyboardLayoutSettingStore } from '../stores/keyboard-layout-setting.store';
import { PhaseSettingStore } from '../stores/phase-setting.store';
import { PracticeStatisticStore } from '../stores/practice-statistic.store';
import {
  appendLabelStateToChordData,
  convertFlattenedChordTreeNodesToChordData,
} from '../utils/chord.utils';
import { OperatingSystemService } from './operating-system.service';

@Injectable({ providedIn: 'root' })
export class ChordDataService {
  private readonly keyboardLayout = inject(KeyboardLayoutSettingStore)
    .selectedEntity;
  private readonly operatingSystem = inject(OperatingSystemService);
  private readonly chordStore = inject(ChordStore);
  private readonly chordLabelStore = inject(ChordLabelStore);
  private readonly practiceStatisticStore = inject(PracticeStatisticStore);
  private readonly phaseSettingStore = inject(PhaseSettingStore);

  public readonly chordDataList = computed(() => {
    const keyboardLayout = this.keyboardLayout();
    const operatingSystem = this.operatingSystem.getOS();
    return convertFlattenedChordTreeNodesToChordData(
      this.chordStore.flatChordTreeNodes(),
      keyboardLayout,
      operatingSystem,
    );
  });

  public chordDataListWithLabelState = computed(() => {
    const bookmarkedHashSet = this.chordLabelStore.bookmarkedHashSet();
    const blockedHashSet = this.chordLabelStore.blockedHashSet();
    return this.chordDataList().map((c) =>
      appendLabelStateToChordData(c, bookmarkedHashSet, blockedHashSet),
    );
  });

  public chordDataListWithLabelStateAndStatistic = computed<
    ChordDataWithLabelStateAndStatistic[]
  >(() => {
    const chords = this.chordDataListWithLabelState();
    const adaptationPracticeStatistic =
      this.practiceStatisticStore.adaptation();
    const realizationPracticeStatistic =
      this.practiceStatisticStore.realization();
    const adaptationPhaseSetting = this.phaseSettingStore.adaptation();
    const realizationPhaseSetting = this.phaseSettingStore.realization();
    return chords.map((c) => {
      const as = adaptationPracticeStatistic[c.textOutput];
      const rs = realizationPracticeStatistic[c.textOutput];
      const adaptation = as
        ? {
            lastTenAverageChordPerMinute: as.lastTenAverageChordPerMinute,
            correctCount: as.correctCount,
            passed:
              as.lastTenAverageChordPerMinute >=
                adaptationPhaseSetting.minSpeedToPass &&
              as.correctCount >= adaptationPhaseSetting.minRepsToPass,
          }
        : {
            lastTenAverageChordPerMinute: null,
            correctCount: null,
            passed: false,
          };
      const realization = rs
        ? {
            lastTenAverageChordPerMinute: rs.lastTenAverageChordPerMinute,
            correctCount: rs.correctCount,
            passed:
              rs.lastTenAverageChordPerMinute >=
                realizationPhaseSetting.minSpeedToPass &&
              rs.correctCount >= realizationPhaseSetting.minRepsToPass,
          }
        : {
            lastTenAverageChordPerMinute: null,
            correctCount: null,
            passed: false,
          };
      return {
        ...c,
        adaptation,
        realization,
      };
    });
  });

  public adaptationPhaseRemainedChordCount = computed<number>(
    () =>
      this.chordDataListWithLabelStateAndStatistic().filter(
        (c) => !c.adaptation.passed,
      ).length,
  );

  public adaptationPhasePassedChordCount = computed<number>(
    () =>
      this.chordDataListWithLabelStateAndStatistic().filter(
        (c) => c.adaptation.passed,
      ).length,
  );

  public realizationPhaseRemainedChordCount = computed<number>(
    () =>
      this.chordDataListWithLabelStateAndStatistic().filter(
        (c) => c.adaptation.passed && !c.realization.passed,
      ).length,
  );

  public chordGroups = computed<ChordGroup[]>(() => {
    const chords = this.chordDataListWithLabelState();
    return toPairs(groupBy(prop('textOutput'), chords))
      .map(([textOutput, chordsInGroup]) => {
        const englishWordRank =
          ENGLISH_WORD_RANK_MAP.get(textOutput.trim().toLocaleLowerCase()) ??
          Infinity;
        const nonBlockedChords = sortWith(
          [
            ascend(
              path(['ancestorKeyLabel', 'length']) as (obj: any) => number,
            ),
            ascend(path(['input', 'length']) as (obj: any) => number),
          ],
          (chordsInGroup ?? []).filter((c) => !c.blocked),
        );
        return {
          textOutput,
          englishWordRank,
          bookmarked: nonBlockedChords.some((c) => c.bookmarked),
          nonBlockedChords,
        };
      })
      .filter((cg) => cg.nonBlockedChords.length > 0);
  });
}
