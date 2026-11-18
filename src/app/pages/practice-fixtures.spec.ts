import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { provideTranslateService } from '@ngx-translate/core';
import { Chord, convertChordInNumberListFormToChord } from 'tangent-cc-lib';
import { OperatingSystemService } from 'src/app/services/operating-system.service';
import { ChordLabelStore } from 'src/app/stores/chord-label.store';
import { ChordStore } from 'src/app/stores/chord.store';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';
import { PracticeStatisticStore } from 'src/app/stores/practice-statistic.store';
import { Phase } from 'src/app/models/phase.models';

/** Shared setup for the specs of the pages that build a practice set. */

const pad12 = (...codes: number[]) => [
  ...Array(12 - codes.length).fill(0),
  ...codes,
];

/** Builds a chord from the text it types, using a distinct pair of keys per id. */
export function makeWordChord(text: string, keyPairIndex: number): Chord {
  const outputs = [...text].map((ch) => ch.charCodeAt(0));
  const first = 97 + (keyPairIndex % 12);
  const second = 97 + Math.floor(keyPairIndex / 12) + 12;
  return convertChordInNumberListFormToChord([pad12(first, second), outputs]);
}

export interface PracticeFixture<T> {
  component: T;
  chords: Record<string, Chord>;
  labels: InstanceType<typeof ChordLabelStore>;
  statistic: InstanceType<typeof PracticeStatisticStore>;
  phase: InstanceType<typeof PhaseSettingStore>;
  /** Saves practice records that give `count` correct entries at 60 chords per minute. */
  practice: (
    p: Phase,
    text: string,
    count: number,
    intervalMs?: number,
  ) => void;
  block: (text: string) => void;
  bookmark: (text: string) => void;
}

/** Creates a page with the given words as chords, with the practice view left out. */
export function createPage<T>(
  page: Type<T>,
  words: string[],
  inputs: Record<string, unknown> = {},
  resetTesting = true,
): PracticeFixture<T> {
  localStorage.clear();
  if (resetTesting) {
    TestBed.resetTestingModule();
  }
  TestBed.configureTestingModule({
    providers: [
      { provide: OperatingSystemService, useValue: { getOS: () => 'Windows' } },
      provideTranslateService(),
    ],
  });
  // The practice view is the other component under test; the pages only hand it a set.
  TestBed.overrideComponent(page, { set: { imports: [], template: '' } });
  const chordStore = TestBed.inject(ChordStore);
  const labels = TestBed.inject(ChordLabelStore);
  const statistic = TestBed.inject(PracticeStatisticStore);
  const phase = TestBed.inject(PhaseSettingStore);
  const chords: Record<string, Chord> = {};
  words.forEach((w, i) => (chords[w] = makeWordChord(w, i)));
  patchState(chordStore, setAllEntities(Object.values(chords)));
  const fixture = TestBed.createComponent(page);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  const hashOf = (text: string) =>
    ({
      actionAndPhraseHash: chords[text].actionAndPhraseHash,
    }) as never;
  return {
    component: fixture.componentInstance,
    chords,
    labels,
    statistic,
    phase,
    practice: (p, text, count, intervalMs = 1000) => {
      for (let i = 0; i < count; i++) {
        statistic.saveSpeedRecord(p, { textOutput: text } as never, intervalMs);
      }
    },
    block: (text) => labels.blockChord(hashOf(text)),
    bookmark: (text) => labels.bookmarkChord(hashOf(text)),
  };
}

describe('practice fixtures', () => {
  it('gives every word its own chord', () => {
    const hashes = ['the', 'and', 'zzq', 'zzr'].map(
      (w, i) => makeWordChord(w, i).actionAndPhraseHash,
    );
    expect(new Set(hashes).size).toBe(4);
  });
});
