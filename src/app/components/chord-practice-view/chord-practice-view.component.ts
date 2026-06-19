import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
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
import { debounceTime, Subject, switchMap, timer } from 'rxjs';
import { ChordGroup } from 'src/app/models/chord.models';
import { Phase } from 'src/app/models/phase.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { ChordPracticeViewStore } from 'src/app/stores/chord-practice-view.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';
import { DynamicLibraryAncestorsChipComponent } from '../dynamic-library-ancestors-chip/dynamic-library-ancestors-chip.component';
import { LayoutComponent } from '../layout/layout.component';
import { StepperComponent } from '../stepper/stepper.component';

@UntilDestroy()
@Component({
  selector: 'app-chord-practice-view',
  templateUrl: 'chord-practice-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    class: 'flex flex-col h-full',
  },
  imports: [
    FormsModule,
    LayoutComponent,
    MatIcon,
    IconGuardPipe,
    TranslatePipe,
    RealTitleCasePipe,
    MatButton,
    StepperComponent,
    DynamicLibraryAncestorsChipComponent,
  ],
  providers: [ChordPracticeViewStore],
})
export class ChordPracticeViewComponent implements OnInit {
  public readonly visibilitySettingStore = inject(VisibilitySettingStore);
  private readonly chordPracticeViewStore = inject(ChordPracticeViewStore);
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);

  public practiceSet = input.required<ChordGroup[]>();
  public phase = input.required<Phase>();

  public input = viewChild.required<ElementRef<HTMLInputElement>>('input');

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

  protected readonly history = this.chordPracticeViewStore.history;
  protected readonly queue = this.chordPracticeViewStore.queue;

  protected currentChord = computed(() => this.queue()[0]?.nonBlockedChords[0]);
  protected currentChordDynamicLibraryAncestors = computed(() => {
    const currentChord = this.currentChord();
    if (!currentChord) {
      return [];
    }
    return currentChord.dynamicLibraryAncestors;
  });
  protected totalSteps = computed(() => {
    const currentChord = this.currentChord();
    if (!currentChord) {
      return 0;
    }
    return currentChord.compoundAncestors.length + 1;
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
        : currentChord.compoundAncestors[chordStepIndex].input;
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

  constructor() {
    effect(() => {
      const _ = this.chordPracticeViewStore.lastCorrectChordTime();
      this.inputValue.set('');
    });
    effect(() => {
      const _ = this.chordPracticeViewStore.queue();
      this.restartAnimationSubject.next();
    });
  }

  public ngOnInit(): void {
    this.chordPracticeViewStore.fillQueue(this.practiceSet());
    this.debouncedEntry$
      .pipe(untilDestroyed(this))
      .subscribe(({ timestamp, value }) => {
        this.chordPracticeViewStore.checkText(
          value,
          timestamp,
          this.practiceSet(),
          this.phase(),
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
