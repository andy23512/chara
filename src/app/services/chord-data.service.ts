import { computed, inject, Injectable } from '@angular/core';
import { ascend, groupBy, path, prop, sortWith, toPairs } from 'ramda';
import { ENGLISH_WORD_RANK_MAP } from '../data/english-word-rank';
import {
  ChordDataWithLabelStateAndStatistic,
  ChordGroup,
} from '../models/chord.models';
import { AdaptationPageSettingStore } from '../stores/adaptation-page-setting.store';
import { ChordLabelStore } from '../stores/chord-label.store';
import { FlatChordTreeNodeStore } from '../stores/flat-chord-tree-node.store';
import { KeyboardLayoutSettingStore } from '../stores/keyboard-layout-setting.store';
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
  private readonly flatChordTreeNodes = inject(FlatChordTreeNodeStore).entities;
  private readonly chordLabelStore = inject(ChordLabelStore);
  private readonly practiceStatisticStore = inject(PracticeStatisticStore);
  private readonly adaptationPageSettingStore = inject(
    AdaptationPageSettingStore,
  );

  public readonly chordDataList = computed(() => {
    const keyboardLayout = this.keyboardLayout();
    const operatingSystem = this.operatingSystem.getOS();
    return convertFlattenedChordTreeNodesToChordData(
      this.flatChordTreeNodes(),
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
    const adaptationMinSpeedToPass =
      this.adaptationPageSettingStore.minRepsToPass();
    const adaptationMinRepToPass =
      this.adaptationPageSettingStore.minRepsToPass();
    return chords.map((c) => {
      const s = adaptationPracticeStatistic[c.textOutput];
      if (!s) {
        return {
          ...c,
          adaptation: {
            lastTenAverageChordPerMinute: null,
            correctCount: null,
            passed: false,
          },
        };
      }
      return {
        ...c,
        adaptation: {
          lastTenAverageChordPerMinute: s.lastTenAverageChordPerMinute,
          correctCount: s.correctCount,
          passed:
            s.lastTenAverageChordPerMinute >= adaptationMinSpeedToPass &&
            s.correctCount >= adaptationMinRepToPass,
        },
      };
    });
  });

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
