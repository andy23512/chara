import { TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { Chord, convertChordInNumberListFormToChord } from 'tangent-cc-lib';
import { prefixStorageKey } from '../utils/store.utils';
import { ChordStore } from './chord.store';

const pad12 = (...codes: number[]) => [
  ...Array(12 - codes.length).fill(0),
  ...codes,
];
const make = (input: number[], output: number[]): Chord =>
  convertChordInNumberListFormToChord([pad12(...input), output]);

describe('ChordStore', () => {
  let store: InstanceType<typeof ChordStore>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    store = TestBed.inject(ChordStore);
  });

  it('starts empty', () => {
    expect(store.entityCount()).toBe(0);
    expect(store.flatChordTreeNodes()).toEqual([]);
  });

  it('counts the chords', () => {
    patchState(
      store,
      setAllEntities([make([97, 98], [99]), make([97, 99], [98])]),
    );
    expect(store.entityCount()).toBe(2);
  });

  it('lists the chords as a flat list, each parent before its children', () => {
    const parent = make([97, 98], [99]);
    // a child chord has the parent id packed into the first three actions
    const child: Chord = {
      ...make([100, 99], [97]),
      parentId: parent.id,
    };
    const other = make([98, 99], [100]);
    patchState(store, setAllEntities([child, other, parent]));
    const flat = store.flatChordTreeNodes();
    expect(flat.map((n) => n.id)).toEqual([other.id, parent.id, child.id]);
    expect(flat.map((n) => n.level)).toEqual([0, 0, 1]);
    expect(flat[2].ancestors.map((a) => a.id)).toEqual([parent.id]);
  });

  it('drops chords whose parent is missing', () => {
    const orphan: Chord = { ...make([100, 99], [97]), parentId: 123456 };
    patchState(store, setAllEntities([orphan]));
    expect(store.entityCount()).toBe(1);
    expect(store.flatChordTreeNodes()).toEqual([]);
  });

  it('marks a chord that outputs the dynamic library action code', () => {
    patchState(store, setAllEntities([make([97, 98], [558])]));
    expect(store.flatChordTreeNodes()[0].isDynamicLibraryChord).toBe(true);
  });

  it('is saved to and restored from local storage', () => {
    const chord = make([97, 98], [99]);
    patchState(store, setAllEntities([chord]));
    TestBed.tick();
    expect(localStorage.getItem(prefixStorageKey('chord'))).not.toBeNull();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ChordStore);
    expect(restored.entityCount()).toBe(1);
    expect(restored.flatChordTreeNodes()[0].id).toBe(chord.id);
  });
});
