import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  model,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslatePipe } from '@ngx-translate/core';
import { ascend, descend, prop, sortWith } from 'ramda';
import { debounceTime, Subject } from 'rxjs';
import { LayoutComponent } from 'src/app/components/layout/layout.component';
import { ChordDataWithLabelStateAndEnglishWordRank } from 'src/app/models/chord.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { AdaptationPageSettingStore } from 'src/app/stores/adaptation-page-setting.store';
import { AdaptationPageStore } from 'src/app/stores/adaptation-page.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';

@UntilDestroy()
@Component({
  selector: 'app-adaptation-page',
  templateUrl: 'adaptation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col h-full',
  },
  imports: [
    LayoutComponent,
    FormsModule,
    MatIcon,
    IconGuardPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
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

  public input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly history = this.adaptationPageStore.history;
  protected readonly queue = this.adaptationPageStore.queue;
  protected readonly isFocus = signal(false);
  protected readonly inputValue = model<string>('');
  private readonly entrySubject = new Subject<{
    timestamp: number;
    value: string;
  }>();
  private readonly debouncedEntry$ = this.entrySubject
    .asObservable()
    .pipe(debounceTime(100));

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

  constructor() {
    effect(() => {
      const _ = this.adaptationPageStore.lastCorrectChordTime();
      this.inputValue.set('');
    });
  }

  public ngOnInit(): void {
    this.adaptationPageStore.fillQueue(this.practiceSet());
    this.debouncedEntry$
      .pipe(untilDestroyed(this))
      .subscribe(({ timestamp, value }) => {
        this.adaptationPageStore.checkText(
          value,
          timestamp,
          this.practiceSet(),
        );
      });
  }

  public startPractice() {
    this.input().nativeElement.focus();
  }

  public onInput(event: InputEvent) {
    const timestamp = Date.now();
    const value = this.inputValue();
    this.entrySubject.next({ timestamp, value });
  }
}
