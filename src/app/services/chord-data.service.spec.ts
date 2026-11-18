import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { Chord, convertChordInNumberListFormToChord } from 'tangent-cc-lib';
import { Phase } from '../models/phase.models';
import { ChordLabelStore } from '../stores/chord-label.store';
import { ChordStore } from '../stores/chord.store';
import { PhaseSettingStore } from '../stores/phase-setting.store';
import { PracticeStatisticStore } from '../stores/practice-statistic.store';
import { ChordDataService } from './chord-data.service';
import { OperatingSystemService } from './operating-system.service';

const pad12 = (...codes: number[]) => [
  ...Array(12 - codes.length).fill(0),
  ...codes,
];
const make = (input: number[], output: number[]): Chord =>
  convertChordInNumberListFormToChord([pad12(...input), output]);

// Output action codes: a=97, b=98, c=99, d=100.
const AB = make([97, 98], [97, 98]); // "ab"
const BA = make([98, 99], [97, 98]); // "ab" too, same group as AB
const C = make([99, 100], [99]); // "c"
const D = make([97, 100], [100]); // "d"

describe('ChordDataService', () => {
  let service: ChordDataService;
  let chordStore: InstanceType<typeof ChordStore>;
  let labels: InstanceType<typeof ChordLabelStore>;
  let statistic: InstanceType<typeof PracticeStatisticStore>;
  let phase: InstanceType<typeof PhaseSettingStore>;

  const setChords = (...chords: Chord[]) =>
    patchState(chordStore, setAllEntities(chords));
  const record = (p: Phase, text: string, intervals: number[]) => {
    for (const i of intervals) {
      statistic.saveSpeedRecord(p, { textOutput: text } as never, i);
    }
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: OperatingSystemService, useValue: { getOS: () => 'Windows' } },
      ],
    });
    service = TestBed.inject(ChordDataService);
    chordStore = TestBed.inject(ChordStore);
    labels = TestBed.inject(ChordLabelStore);
    statistic = TestBed.inject(PracticeStatisticStore);
    phase = TestBed.inject(PhaseSettingStore);
  });

  it('is empty without chords', () => {
    expect(service.chordDataList()).toEqual([]);
    expect(service.chordGroups()).toEqual([]);
    expect(service.adaptationPhaseRemainedChordCount()).toBe(0);
    expect(service.realizationPhasePassedChordCount()).toBe(0);
  });

  describe('chordDataList', () => {
    it('has one entry per chord, with the output as text', () => {
      setChords(AB, C);
      expect(service.chordDataList().map((c) => c.textOutput).sort()).toEqual([
        'ab',
        'c',
      ]);
    });
  });

  describe('dynamicLibraries', () => {
    it('lists only the chords that output the dynamic library code', () => {
      const lib = make([97, 99], [558]);
      setChords(AB, lib);
      expect(service.dynamicLibraries().map((c) => c.id)).toEqual([lib.id]);
    });
  });

  describe('label state', () => {
    it('marks bookmarked and blocked chords', () => {
      setChords(AB, C, D);
      labels.bookmarkChord({ actionAndPhraseHash: AB.actionAndPhraseHash } as never);
      labels.blockChord({ actionAndPhraseHash: C.actionAndPhraseHash } as never);
      const byText = Object.fromEntries(
        service.chordDataListWithLabelState().map((c) => [c.textOutput, c]),
      );
      expect(byText['ab'].bookmarked).toBe(true);
      expect(byText['ab'].blocked).toBe(false);
      expect(byText['c'].blocked).toBe(true);
      expect(byText['d'].bookmarked).toBe(false);
    });
  });

  describe('practice progress', () => {
    const adaptation = (text: string) =>
      service.chordDataListWithLabelStateAndStatistic().find((c) => c.textOutput === text)!
        .adaptation;

    beforeEach(() => {
      setChords(AB, C);
      phase.set(Phase.Adaptation, 'minRepsToPass', 3);
      phase.set(Phase.Adaptation, 'minSpeedToPass', 60);
      phase.set(Phase.Realization, 'minRepsToPass', 2);
      phase.set(Phase.Realization, 'minSpeedToPass', 60);
    });

    it('has no numbers and has not passed for a chord never practiced', () => {
      expect(adaptation('ab')).toEqual({
        lastTenAverageChordPerMinute: null,
        correctCount: null,
        passed: false,
      });
      const row = service.chordDataListWithLabelStateAndStatistic()[0];
      expect(row.accumulation).toEqual({
        lastTenAverageChordPerMinute: null,
        correctCount: null,
      });
    });

    it('does not pass with too few repetitions', () => {
      record(Phase.Adaptation, 'ab', [500, 500]); // fast but only 2
      expect(adaptation('ab').passed).toBe(false);
    });

    it('does not pass when too slow', () => {
      record(Phase.Adaptation, 'ab', [2000, 2000, 2000]); // 30 per minute
      expect(adaptation('ab').passed).toBe(false);
    });

    it('passes with enough repetitions at enough speed', () => {
      record(Phase.Adaptation, 'ab', [1000, 1000, 1000]); // 60 per minute
      expect(adaptation('ab')).toEqual({
        lastTenAverageChordPerMinute: 60,
        correctCount: 3,
        passed: true,
      });
    });

    it('keeps the practice records of other chords apart', () => {
      record(Phase.Adaptation, 'ab', [1000, 1000, 1000]);
      expect(adaptation('c').passed).toBe(false);
    });

    it('passes realization with its own pass requirements', () => {
      record(Phase.Realization, 'ab', [1000, 1000]);
      const row = service
        .chordDataListWithLabelStateAndStatistic()
        .find((c) => c.textOutput === 'ab')!;
      expect(row.realization.passed).toBe(true);
      expect(row.adaptation.passed).toBe(false);
    });

    it('reports accumulation numbers without a pass state', () => {
      record(Phase.Accumulation, 'ab', [1000, 1000]);
      const row = service
        .chordDataListWithLabelStateAndStatistic()
        .find((c) => c.textOutput === 'ab')!;
      expect(row.accumulation).toEqual({
        lastTenAverageChordPerMinute: 60,
        correctCount: 2,
      });
    });

    describe('counts', () => {
      it('counts every chord as remaining in adaptation at the start', () => {
        expect(service.adaptationPhaseRemainedChordCount()).toBe(2);
        expect(service.adaptationPhasePassedChordCount()).toBe(0);
        expect(service.realizationPhaseRemainedChordCount()).toBe(0);
        expect(service.realizationPhasePassedChordCount()).toBe(0);
      });

      it('moves a chord to realization once adaptation is passed', () => {
        record(Phase.Adaptation, 'ab', [1000, 1000, 1000]);
        expect(service.adaptationPhaseRemainedChordCount()).toBe(1);
        expect(service.adaptationPhasePassedChordCount()).toBe(1);
        expect(service.realizationPhaseRemainedChordCount()).toBe(1);
        expect(service.realizationPhasePassedChordCount()).toBe(0);
      });

      it('counts a chord as realization-passed only after both phases', () => {
        record(Phase.Adaptation, 'ab', [1000, 1000, 1000]);
        record(Phase.Realization, 'ab', [1000, 1000]);
        expect(service.realizationPhaseRemainedChordCount()).toBe(0);
        expect(service.realizationPhasePassedChordCount()).toBe(1);
      });

      it('does not count realization progress of a chord that skipped adaptation', () => {
        record(Phase.Realization, 'ab', [1000, 1000]);
        expect(service.realizationPhasePassedChordCount()).toBe(0);
        expect(service.realizationPhaseRemainedChordCount()).toBe(0);
      });

      it('follows changes of the pass requirements', () => {
        record(Phase.Adaptation, 'ab', [1000, 1000, 1000]);
        phase.set(Phase.Adaptation, 'minRepsToPass', 10);
        expect(service.adaptationPhasePassedChordCount()).toBe(0);
      });
    });
  });

  describe('chordGroups', () => {
    it('groups chords that give the same text', () => {
      setChords(AB, BA, C);
      const groups = service.chordGroups();
      expect(groups.map((g) => g.textOutput).sort()).toEqual(['ab', 'c']);
      expect(groups.find((g) => g.textOutput === 'ab')!.nonBlockedChords.length).toBe(2);
    });

    // Current behavior, almost certainly not what was meant: the sort keys are
    // `ancestorKeyLabel.length` (no such field exists) and `input.length` (the
    // zero-padded raw input, always the same length), so the order of the
    // chords in a group is just the order they came in.
    it('does not actually sort the chords of a group (sort keys are dead)', () => {
      const longer = make([97, 98, 99], [97, 98]);
      setChords(longer, AB);
      const group = service.chordGroups().find((g) => g.textOutput === 'ab')!;
      expect(group.nonBlockedChords.map((c) => c.id)).toEqual([longer.id, AB.id]);
    });

    it('leaves out blocked chords', () => {
      setChords(AB, BA);
      labels.blockChord({ actionAndPhraseHash: AB.actionAndPhraseHash } as never);
      const [group] = service.chordGroups();
      expect(group.nonBlockedChords.length).toBe(1);
      expect(group.nonBlockedChords[0].id).toBe(BA.id);
    });

    it('drops a group whose chords are all blocked', () => {
      setChords(AB, C);
      labels.blockChord({ actionAndPhraseHash: AB.actionAndPhraseHash } as never);
      expect(service.chordGroups().map((g) => g.textOutput)).toEqual(['c']);
    });

    it('is bookmarked when any chord that is not blocked is bookmarked', () => {
      setChords(AB, BA);
      labels.bookmarkChord({ actionAndPhraseHash: BA.actionAndPhraseHash } as never);
      expect(service.chordGroups()[0].bookmarked).toBe(true);
    });

    it('is not bookmarked when only a blocked chord is bookmarked', () => {
      setChords(AB, BA);
      labels.bookmarkChord({ actionAndPhraseHash: AB.actionAndPhraseHash } as never);
      labels.blockChord({ actionAndPhraseHash: AB.actionAndPhraseHash } as never);
      expect(service.chordGroups()[0].bookmarked).toBe(false);
    });

    it('gives the English frequency rank of the word, and Infinity for others', () => {
      setChords(make([100, 101], [116, 104, 101]), make([97, 98], [122, 122, 113])); // "the" is rank 0
      const groups = service.chordGroups();
      expect(groups.find((g) => g.textOutput === 'the')?.englishWordRank).toBe(0);
      expect(groups.find((g) => g.textOutput === 'zzq')!.englishWordRank).toBe(Infinity);
    });
  });
});
