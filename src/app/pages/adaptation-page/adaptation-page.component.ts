import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { ascend, descend, prop, sortWith } from 'ramda';
import { LayoutComponent } from 'src/app/components/layout/layout.component';
import { ChordDataWithLabelStateAndEnglishWordRank } from 'src/app/models/chord.models';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { AdaptationPageSettingStore } from 'src/app/stores/adaptation-page-setting.store';
import { AdaptationPageStore } from 'src/app/stores/adaptation-page.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';

@Component({
  selector: 'app-adaptation-page',
  templateUrl: 'adaptation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col h-full',
  },
  imports: [LayoutComponent],
  providers: [AdaptationPageStore],
})
export class AdaptationPageComponent implements OnInit {
  public readonly visibilitySettingStore = inject(VisibilitySettingStore);
  private readonly adaptationPageStore = inject(AdaptationPageStore);
  private readonly chordDataService = inject(ChordDataService);
  private readonly adaptationPageSettingStore = inject(
    AdaptationPageSettingStore,
  );
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);

  protected readonly queue = this.adaptationPageStore.queue;
  protected highlightedPositionCodes = computed(() => {
    const profileLayoutMap = this.deviceLayoutStore.profileLayoutMap();
    if (!profileLayoutMap['A']) {
      return [];
    }
    const profileAPrimaryLayer = profileLayoutMap['A'][0];
    const inputActionCodes = (
      this.adaptationPageStore.queue()[0]?.input || []
    ).filter((a) => a !== 0);
    const positionCodes = inputActionCodes.map((actionCode) =>
      profileAPrimaryLayer.indexOf(actionCode),
    );
    if (positionCodes.includes(-1)) {
      console.warn(
        'Some action codes in the current chord are not found in profile A primary layer:',
        inputActionCodes,
      );
      return [];
    }
    return positionCodes;
  });

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

  public ngOnInit(): void {
    this.adaptationPageStore.fillQueue(this.practiceSet());
  }
}
