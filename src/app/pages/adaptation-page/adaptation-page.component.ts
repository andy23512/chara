import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ascend, descend, prop, sortWith } from 'ramda';
import { ChordDataWithLabelStateAndEnglishWordRank } from 'src/app/models/chord.models';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { AdaptationPageSettingStore } from 'src/app/stores/adaptation-page-setting.store';

@Component({
  selector: 'app-adaptation-page',
  templateUrl: 'adaptation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe],
})
export class AdaptationPageComponent {
  private readonly chordDataService = inject(ChordDataService);
  private readonly adaptationPageSettingStore = inject(
    AdaptationPageSettingStore,
  );

  private readonly sortedChords = computed(() => {
    const chords =
      this.chordDataService.chordDataListWithLabelStateAndEnglishWordRank();
    const unblockedChords = chords.filter((c) => !c.blocked);
    return sortWith<ChordDataWithLabelStateAndEnglishWordRank>([
      descend(prop('bookmarked')),
      ascend(prop('englishWordRank')),
    ])(unblockedChords);
  });
  public readonly practiceSet = computed(() =>
    this.sortedChords().slice(
      0,
      this.adaptationPageSettingStore.practiceSetSize(),
    ),
  );
}
