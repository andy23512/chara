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
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslatePipe } from '@ngx-translate/core';
import { ascend, descend, prop, sortWith } from 'ramda';
import { debounceTime, Subject, switchMap, timer } from 'rxjs';
import { LayoutComponent } from 'src/app/components/layout/layout.component';
import { StepperComponent } from 'src/app/components/stepper/stepper.component';
import { ChordGroupWithStats } from 'src/app/models/chord.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { AdaptationPageSettingStore } from 'src/app/stores/adaptation-page-setting.store';
import { AdaptationPageStore } from 'src/app/stores/adaptation-page.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { PracticeStatisticStore } from 'src/app/stores/practice-statistic.store';
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
    MatButton,
    StepperComponent,
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
  private readonly practiceStatisticStore = inject(PracticeStatisticStore);

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
  private readonly restartAnimationSubject = new Subject<void>();
  private readonly animationFrameIndex = toSignal(
    this.restartAnimationSubject
      .asObservable()
      .pipe(switchMap(() => timer(0, 2000))),
  );
  private currentChord = computed(() => this.queue()[0]?.nonBlockedChords[0]);
  protected totalSteps = computed(() => {
    const currentChord = this.currentChord();
    if (!currentChord) {
      return 0;
    }
    return currentChord.ancestors.length + 1;
  });
  protected chordStepIndex = computed(() => {
    const totalSteps = this.totalSteps();
    const animationFrameIndex = this.animationFrameIndex();
    if (!totalSteps || animationFrameIndex === undefined) {
      return 0;
    }
    return animationFrameIndex % totalSteps;
  });

  protected highlightedPositionCodes = computed(() => {
    const profileLayoutMap = this.deviceLayoutStore.profileLayoutMap();
    const chordStepIndex = this.chordStepIndex();
    const totalSteps = this.totalSteps();
    const currentChord = this.currentChord();
    if (!profileLayoutMap['A'] || !currentChord || !totalSteps) {
      return [];
    }
    const profileAPrimaryLayer = profileLayoutMap['A'][0];
    const input =
      chordStepIndex === totalSteps - 1
        ? currentChord.input
        : currentChord.ancestors[chordStepIndex].input;
    const inputActionCodes: number[] = input.filter((a: number) => a !== 0);
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
  private readonly chordGroupsWithStats = computed<ChordGroupWithStats[]>(
    () => {
      const chordGroups = this.chordDataService.chordGroups();
      const practiceStatistic = this.practiceStatisticStore.adaptation();
      const minSpeedToPass = this.adaptationPageSettingStore.minSpeedToPass();
      const minRepToPass = this.adaptationPageSettingStore.minRepsToPass();
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
          statistic.correctCount >= minRepToPass &&
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
      this.adaptationPageSettingStore.practiceSetSize(),
    ),
  );

  constructor() {
    effect(() => {
      const _ = this.adaptationPageStore.lastCorrectChordTime();
      this.inputValue.set('');
    });
    effect(() => {
      const _ = this.adaptationPageStore.queue();
      this.restartAnimationSubject.next();
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
    this.restartAnimationSubject.next();
  }

  public onInput(event: InputEvent) {
    const timestamp = Date.now();
    const value = this.inputValue();
    this.entrySubject.next({ timestamp, value });
  }
}
