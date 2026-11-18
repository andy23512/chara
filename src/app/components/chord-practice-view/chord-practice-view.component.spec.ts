import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { HotkeysService } from '@ngneat/hotkeys';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ChordGroup } from 'src/app/models/chord.models';
import { HintDisplayMode } from 'src/app/models/hint-display-mode.models';
import { Phase } from 'src/app/models/phase.models';
import { ChordPracticeViewStore } from 'src/app/stores/chord-practice-view.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';
import { ChordPracticeViewComponent } from './chord-practice-view.component';

const DEBOUNCE_MS = 100;
const IDLE_MS = 5000;
const STEP_MS = 2000;

/** A chord group with one chord. `ancestors` are the compound ancestors. */
function group(
  textOutput: string,
  input: number[] = [0, 0, 97, 98],
  ancestorInputs: number[][] = [],
): ChordGroup {
  return {
    textOutput,
    englishWordRank: 0,
    bookmarked: false,
    nonBlockedChords: [
      {
        input,
        compoundAncestors: ancestorInputs.map((i) => ({ input: i })),
        dynamicLibraryAncestors: [],
      },
    ],
  } as unknown as ChordGroup;
}

/** A group that has no chord to ask for (for example, all of them are blocked). */
const groupWithoutChords = () =>
  ({
    textOutput: 'a',
    englishWordRank: 0,
    bookmarked: false,
    nonBlockedChords: [],
  }) as unknown as ChordGroup;

interface Internals {
  highlightedPositionCodes: () => number[];
  showHint: () => boolean;
  totalSteps: () => number;
  chordStepIndex: () => number;
  currentChord: () => unknown;
  isFocus: () => boolean;
  inputValue: () => string;
  history: () => ChordGroup[];
  queue: () => ChordGroup[];
}

describe('ChordPracticeViewComponent', () => {
  let fixture: ComponentFixture<ChordPracticeViewComponent>;
  let component: ChordPracticeViewComponent;
  let internals: Internals;
  let store: InstanceType<typeof ChordPracticeViewStore>;
  let startShortcut: Subject<unknown>;
  let pauseShortcut: Subject<unknown>;
  let hotkeys: { addShortcut: jasmine.Spy; removeShortcuts: jasmine.Spy };

  const inputEl = () =>
    fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const text = (selector: string) =>
    fixture.nativeElement.querySelector(selector)?.textContent?.trim();

  function create(
    practiceSet: ChordGroup[] = [group('a')],
    {
      hintDisplayMode = 'always' as HintDisplayMode,
      phase = Phase.Adaptation as Phase | null,
    } = {},
  ) {
    fixture = TestBed.createComponent(ChordPracticeViewComponent);
    component = fixture.componentInstance;
    internals = component as unknown as Internals;
    fixture.componentRef.setInput('practiceSet', practiceSet);
    fixture.componentRef.setInput('phase', phase);
    fixture.componentRef.setInput('hintDisplayMode', hintDisplayMode);
    fixture.detectChanges();
    store = fixture.debugElement.injector.get(ChordPracticeViewStore);
  }

  /** Types the text into the input the way the browser reports it. */
  function type(value: string) {
    inputEl().value = value;
    inputEl().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  const keyDown = (code: string) =>
    inputEl().dispatchEvent(new KeyboardEvent('keydown', { code }));
  const keyUp = (code: string) => {
    inputEl().dispatchEvent(new KeyboardEvent('keyup', { code }));
    fixture.detectChanges();
  };
  const wait = (ms: number) => {
    tick(ms);
    fixture.detectChanges();
  };
  /** Stops the timers that the component keeps running. */
  const finish = () => fixture.destroy();

  beforeEach(() => {
    localStorage.clear();
    startShortcut = new Subject();
    pauseShortcut = new Subject();
    hotkeys = {
      addShortcut: jasmine
        .createSpy('addShortcut')
        .and.callFake(({ keys }: { keys: string }) =>
          keys === 'space' ? startShortcut : pauseShortcut,
        ),
      removeShortcuts: jasmine.createSpy('removeShortcuts'),
    };
    TestBed.configureTestingModule({
      imports: [ChordPracticeViewComponent],
      providers: [
        provideTranslateService(),
        { provide: HotkeysService, useValue: hotkeys },
      ],
    });
  });

  describe('at the start', () => {
    it('fills the queue from the practice set and shows the first chord underlined', fakeAsync(() => {
      create([group('a'), group('b')]);
      expect(internals.queue().length).toBe(40);
      const spans = fixture.nativeElement.querySelectorAll(
        '.underline-offset-8',
      );
      expect(spans.length).toBe(40);
      expect(spans[0].classList).toContain('underline');
      expect(spans[1].classList).not.toContain('underline');
      finish();
    }));

    it('has nothing in the history and an empty entry', fakeAsync(() => {
      create();
      expect(internals.history()).toEqual([]);
      expect(internals.inputValue()).toBe('');
      expect(internals.isFocus()).toBe(false);
      finish();
    }));
  });

  describe('checking the entry', () => {
    it('accepts a correct entry only after the debounce time', fakeAsync(() => {
      create();
      type('a');
      wait(DEBOUNCE_MS - 1);
      expect(internals.history().length).toBe(0);
      wait(1);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('clears the entry after a correct answer', fakeAsync(() => {
      create();
      type('a');
      wait(DEBOUNCE_MS);
      expect(internals.inputValue()).toBe('');
      expect(inputEl().value).toBe('');
      finish();
    }));

    it('does not accept a wrong entry, and keeps it', fakeAsync(() => {
      create();
      type('x');
      wait(DEBOUNCE_MS * 3);
      expect(internals.history().length).toBe(0);
      expect(internals.inputValue()).toBe('x');
      finish();
    }));

    it('checks only the last entry when several come within the debounce time', fakeAsync(() => {
      create();
      type('x');
      wait(DEBOUNCE_MS / 2);
      type('a');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('uses the phase it was given for the statistics', fakeAsync(() => {
      create([group('a')], { phase: null });
      type('a');
      wait(DEBOUNCE_MS);
      type('a');
      wait(DEBOUNCE_MS);
      expect(store.chordIntervals().length).toBe(1);
      finish();
    }));
  });

  describe('while keys are held down (the device may still rewrite the input)', () => {
    it('does not check the entry', fakeAsync(() => {
      create();
      keyDown('KeyA');
      type('a');
      wait(DEBOUNCE_MS * 5);
      expect(internals.history().length).toBe(0);
      finish();
    }));

    it('checks it after the last key is released, once the debounce time has passed', fakeAsync(() => {
      create();
      keyDown('KeyA');
      type('a');
      wait(DEBOUNCE_MS * 5);
      keyUp('KeyA');
      wait(DEBOUNCE_MS - 1);
      expect(internals.history().length).toBe(0);
      wait(1);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('waits for every held key to be released', fakeAsync(() => {
      create();
      keyDown('KeyA');
      keyDown('KeyB');
      type('a');
      keyUp('KeyA');
      wait(DEBOUNCE_MS * 5);
      expect(internals.history().length).toBe(0);
      keyUp('KeyB');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('counts the same key only once', fakeAsync(() => {
      create();
      keyDown('KeyA');
      keyDown('KeyA'); // key repeat
      type('a');
      keyUp('KeyA');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('does not check anything when the entry is empty at release', fakeAsync(() => {
      create();
      spyOn(store, 'checkText');
      keyDown('KeyA');
      keyUp('KeyA');
      wait(DEBOUNCE_MS * 5);
      expect(store.checkText).not.toHaveBeenCalled();
      finish();
    }));

    it('checks the entry as it is at release, not as it was when typed', fakeAsync(() => {
      create();
      keyDown('KeyA');
      type('x'); // the raw key press
      type('a'); // rewritten by the device
      keyUp('KeyA');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('does not check a wrong entry at release', fakeAsync(() => {
      create();
      keyDown('KeyA');
      type('x');
      keyUp('KeyA');
      wait(DEBOUNCE_MS * 3);
      expect(internals.history().length).toBe(0);
      finish();
    }));

    it('measures the time from when the entry was typed, not from the release', fakeAsync(() => {
      create();
      type('a'); // first answer, no keys held
      wait(DEBOUNCE_MS);
      expect(store.chordIntervals()).toEqual([]);
      const firstTime = store.lastCorrectChordTime()!;
      wait(900);
      keyDown('KeyA');
      type('a'); // second answer, typed 1000 ms after the first
      wait(400);
      keyUp('KeyA'); // released 400 ms later
      wait(DEBOUNCE_MS);
      expect(store.chordIntervals()).toEqual([
        store.lastCorrectChordTime()! - firstTime,
      ]);
      expect(store.chordIntervals()[0]).toBe(1000);
      finish();
    }));
  });

  describe('forgetting held keys', () => {
    it('forgets them when practice is paused, so a missed key release cannot block checks', fakeAsync(() => {
      create();
      keyDown('KeyA'); // its keyup never arrives
      component.pausePractice();
      type('a');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('forgets them when practice is started', fakeAsync(() => {
      create();
      keyDown('KeyA');
      component.startPractice();
      type('a');
      wait(DEBOUNCE_MS);
      expect(internals.history().length).toBe(1);
      finish();
    }));

    it('keeps them when practice is started while it is already running', fakeAsync(() => {
      create();
      component.startPractice();
      fixture.detectChanges();
      expect(internals.isFocus()).toBe(true);
      keyDown('KeyA');
      component.startPractice(); // already running: nothing changes
      type('a');
      wait(DEBOUNCE_MS * 3);
      expect(internals.history().length).toBe(0);
      finish();
    }));
  });

  describe('start and pause', () => {
    it('focuses the input and clears the entry when started', fakeAsync(() => {
      create();
      type('x');
      component.startPractice();
      fixture.detectChanges();
      expect(document.activeElement).toBe(inputEl());
      expect(internals.isFocus()).toBe(true);
      expect(internals.inputValue()).toBe('');
      finish();
    }));

    it('stops when the input loses focus: clears the entry and the timing', fakeAsync(() => {
      create();
      component.startPractice();
      type('a');
      wait(DEBOUNCE_MS);
      expect(store.lastCorrectChordTime()).not.toBeNull();
      type('x');
      inputEl().blur();
      fixture.detectChanges();
      expect(internals.isFocus()).toBe(false);
      expect(internals.inputValue()).toBe('');
      expect(store.lastCorrectChordTime()).toBeNull();
      finish();
    }));

    it('shows the pause button only while running', fakeAsync(() => {
      create();
      expect(text('kbd:last-of-type')).not.toBe('esc');
      component.startPractice();
      fixture.detectChanges();
      const kbds = [...fixture.nativeElement.querySelectorAll('kbd')].map(
        (k: HTMLElement) => k.textContent?.trim(),
      );
      expect(kbds).toEqual(['space', 'esc']);
      finish();
    }));
  });

  describe('keyboard shortcuts', () => {
    it('registers space to start and escape to pause (also inside the input)', fakeAsync(() => {
      create();
      expect(hotkeys.addShortcut).toHaveBeenCalledWith({ keys: 'space' });
      expect(hotkeys.addShortcut).toHaveBeenCalledWith({
        keys: 'escape',
        allowIn: ['INPUT'],
      });
      finish();
    }));

    it('starts practice on space', fakeAsync(() => {
      create();
      startShortcut.next(undefined);
      fixture.detectChanges();
      expect(internals.isFocus()).toBe(true);
      finish();
    }));

    it('pauses practice on escape', fakeAsync(() => {
      create();
      component.startPractice();
      fixture.detectChanges();
      pauseShortcut.next(undefined);
      fixture.detectChanges();
      expect(internals.isFocus()).toBe(false);
      finish();
    }));

    it('removes the shortcuts when destroyed', fakeAsync(() => {
      create();
      fixture.destroy();
      expect(hotkeys.removeShortcuts).toHaveBeenCalledOnceWith([
        'space',
        'escape',
      ]);
    }));

    it('stops checking entries when destroyed', fakeAsync(() => {
      create();
      type('a');
      const checked = spyOn(store, 'checkText');
      fixture.destroy();
      tick(DEBOUNCE_MS * 2);
      expect(checked).not.toHaveBeenCalled();
    }));
  });

  describe('hints', () => {
    const profileA = (layer: number[]) =>
      TestBed.inject(DeviceLayoutStore).setProfileLayoutMap({
        A: [layer],
      } as never);

    describe('highlighted keys', () => {
      it('is empty without a device layout', fakeAsync(() => {
        create([group('a', [0, 0, 97, 98])]);
        expect(internals.highlightedPositionCodes()).toEqual([]);
        finish();
      }));

      it('gives the positions of the input keys on the primary layer of profile A', fakeAsync(() => {
        profileA([10, 97, 20, 98, 30]);
        create([group('a', [0, 0, 97, 98])]);
        expect(internals.highlightedPositionCodes()).toEqual([1, 3]);
        finish();
      }));

      it('ignores the zero padding of the input', fakeAsync(() => {
        profileA([97]);
        create([group('a', [0, 0, 0, 97])]);
        expect(internals.highlightedPositionCodes()).toEqual([0]);
        finish();
      }));

      it('is empty, with a warning, when a key is not on the layer', fakeAsync(() => {
        profileA([97]);
        const warn = spyOn(console, 'warn');
        create([group('a', [0, 97, 98])]);
        expect(internals.highlightedPositionCodes()).toEqual([]);
        expect(warn).toHaveBeenCalled();
        finish();
      }));

      it('is empty when the group has no chord to ask for', fakeAsync(() => {
        profileA([97]);
        create([groupWithoutChords()]);
        expect(internals.currentChord()).toBeUndefined();
        expect(internals.highlightedPositionCodes()).toEqual([]);
        finish();
      }));
    });

    describe('steps of a compound chord', () => {
      const compound = () =>
        group(
          'ab',
          [0, 99],
          [
            [0, 97],
            [0, 98],
          ],
        ); // two ancestors, then 99

      it('has one step for a simple chord and one more per compound ancestor', fakeAsync(() => {
        create([group('a')]);
        expect(internals.totalSteps()).toBe(1);
        finish();
      }));

      it('counts the ancestors', fakeAsync(() => {
        create([compound()]);
        expect(internals.totalSteps()).toBe(3);
        finish();
      }));

      it('has no steps without a chord', fakeAsync(() => {
        create([groupWithoutChords()]);
        expect(internals.totalSteps()).toBe(0);
        expect(internals.chordStepIndex()).toBe(0);
        finish();
      }));

      it('shows the steps one after another, every 2 seconds, once hints appear after idle time', fakeAsync(() => {
        profileA([97, 98, 99]);
        create([compound()], { hintDisplayMode: 'timeout' });
        component.startPractice();
        fixture.detectChanges();
        wait(IDLE_MS);
        expect(internals.chordStepIndex()).toBe(0);
        expect(internals.highlightedPositionCodes()).toEqual([0]);
        wait(STEP_MS);
        expect(internals.chordStepIndex()).toBe(1);
        expect(internals.highlightedPositionCodes()).toEqual([1]);
        wait(STEP_MS);
        expect(internals.chordStepIndex()).toBe(2);
        expect(internals.highlightedPositionCodes()).toEqual([2]);
        wait(STEP_MS);
        expect(internals.chordStepIndex()).toBe(0); // starts over
        finish();
      }));
    });

    describe('when hints show', () => {
      it('never shows them while not running', fakeAsync(() => {
        create([group('a')], { hintDisplayMode: 'always' });
        expect(internals.showHint()).toBe(false);
        finish();
      }));

      it('"always": shows them as soon as practice runs', fakeAsync(() => {
        create([group('a')], { hintDisplayMode: 'always' });
        component.startPractice();
        fixture.detectChanges();
        expect(internals.showHint()).toBe(true);
        finish();
      }));

      it('"timeout": shows them only after 5 seconds without a correct answer', fakeAsync(() => {
        create([group('a')], { hintDisplayMode: 'timeout' });
        component.startPractice();
        fixture.detectChanges();
        expect(internals.showHint()).toBe(false);
        wait(IDLE_MS - 1);
        expect(internals.showHint()).toBe(false);
        wait(1);
        expect(internals.showHint()).toBe(true);
        finish();
      }));

      it('"timeout": hides them again after a correct answer', fakeAsync(() => {
        create([group('a')], { hintDisplayMode: 'timeout' });
        component.startPractice();
        fixture.detectChanges();
        wait(IDLE_MS);
        expect(internals.showHint()).toBe(true);
        type('a');
        wait(DEBOUNCE_MS);
        expect(internals.showHint()).toBe(false);
        finish();
      }));
    });
  });

  describe('screen parts', () => {
    it('shows the speedometer by default', fakeAsync(() => {
      create();
      expect(
        fixture.nativeElement.querySelector('app-speedometer'),
      ).not.toBeNull();
      finish();
    }));

    // The setting is chosen on the settings page, before this view is built.
    it('hides the speedometer when the setting is off', fakeAsync(() => {
      TestBed.inject(VisibilitySettingStore).set('speedometer', false);
      create();
      expect(fixture.nativeElement.querySelector('app-speedometer')).toBeNull();
      finish();
    }));

    it('lists the answered chords in the history', fakeAsync(() => {
      create();
      type('a');
      wait(DEBOUNCE_MS);
      expect(text('.text-gray-300')).toBe('a');
      finish();
    }));

    it('shows what has been typed so far', fakeAsync(() => {
      create();
      type('x');
      expect(text('.text-chara-500')).toContain('x');
      finish();
    }));
  });
});
