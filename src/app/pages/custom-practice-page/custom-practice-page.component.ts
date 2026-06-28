import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { groupBy, prop, toPairs } from 'ramda';
import { ChordPracticeViewComponent } from 'src/app/components/chord-practice-view/chord-practice-view.component';
import { ChordGroup } from 'src/app/models/chord.models';
import { HintDisplayMode } from 'src/app/models/hint-display-mode.models';
import { ChordDataService } from 'src/app/services/chord-data.service';

@Component({
  selector: 'app-custom-practice-page',
  templateUrl: 'custom-practice-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ChordPracticeViewComponent],
})
export class CustomPracticePageComponent {
  protected chordHashListJson = input.required<string>();
  protected hintDisplayMode = input.required<HintDisplayMode>();

  private readonly chordDataService = inject(ChordDataService);

  protected chordHashList = computed(() =>
    JSON.parse(this.chordHashListJson()),
  );

  protected chordGroups = computed<ChordGroup[]>(() => {
    const chordHashSet = new Set(this.chordHashList());
    const chords = this.chordDataService
      .chordDataListWithLabelStateAndStatistic()
      .filter((c) => chordHashSet.has(c.actionAndPhraseHash));
    return toPairs(groupBy(prop('textOutput'), chords)).map(
      ([textOutput, chordsInGroup]) => ({
        textOutput,
        englishWordRank: 0,
        bookmarked: false,
        nonBlockedChords: chordsInGroup ?? [],
      }),
    );
  });
}
