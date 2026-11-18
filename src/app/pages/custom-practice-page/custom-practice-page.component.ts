import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
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

  private readonly matSnackBar = inject(MatSnackBar);
  private readonly translateService = inject(TranslateService);

  /** The chosen chord hashes, or null when the list in the address is not usable. */
  private readonly parsedChordHashList = computed<string[] | null>(() => {
    try {
      const list = JSON.parse(this.chordHashListJson());
      return Array.isArray(list) && list.every((h) => typeof h === 'string')
        ? list
        : null;
    } catch {
      return null;
    }
  });

  protected chordHashList = computed(() => this.parsedChordHashList() ?? []);

  constructor() {
    effect(() => {
      if (this.parsedChordHashList() === null) {
        this.matSnackBar.open(
          this.translateService.instant(
            'custom-practice-page.invalid-chord-list',
          ),
          undefined,
          { duration: 5000 },
        );
      }
    });
  }

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
