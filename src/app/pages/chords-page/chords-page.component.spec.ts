import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { provideTranslateService } from '@ngx-translate/core';
import { ColDef, ColGroupDef, GridApi } from 'ag-grid-community';
import { CustomPracticeSettingDialogComponent } from 'src/app/components/custom-practice-setting-dialog/custom-practice-setting-dialog.component';
import { ChordKeyLabelType } from 'src/app/models/chord.models';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { OperatingSystemService } from 'src/app/services/operating-system.service';
import { QuickSettingService } from 'src/app/services/quick-setting.service';
import { ChordFilterStore } from 'src/app/stores/chord-filter.store';
import { ChordLabelStore } from 'src/app/stores/chord-label.store';
import { ChordSearchSettingStore } from 'src/app/stores/chord-search-setting.store';
import { ChordStore } from 'src/app/stores/chord.store';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import { makeWordChord } from '../practice-fixtures.spec';
import {
  ChordsPageComponent,
  getChordCountSummary,
  matchesChordSearch,
} from './chords-page.component';

const labelOf = (c: string) => ({ type: ChordKeyLabelType.Char, c, title: c });
const row = (
  input: string,
  output: string,
  extra: Record<string, unknown> = {},
) =>
  ({
    inputKeyLabels: [...input].map(labelOf),
    textOutput: output,
    bookmarked: false,
    blocked: false,
    dynamicLibraryAncestors: [],
    ...extra,
  }) as never;
const match = (
  chord: never,
  query = '',
  opts: {
    input?: boolean;
    output?: boolean;
    bookmark?: 'all' | 'bookmarked' | 'unbookmarked';
    block?: 'all' | 'blocked' | 'unblocked';
    library?: string;
  } = {},
) =>
  matchesChordSearch(
    chord,
    query,
    opts.input ?? true,
    opts.output ?? true,
    opts.bookmark ?? 'all',
    opts.block ?? 'all',
    opts.library ?? 'all',
  );

describe('getChordCountSummary', () => {
  it('returns the total and filtered chord counts for the current search', () => {
    const chords = [
      {
        id: 1,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'A' }],
        textOutput: 'A',
      },
      {
        id: 2,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'B' }],
        textOutput: 'B',
      },
      {
        id: 3,
        inputKeyLabels: [{ type: ChordKeyLabelType.Char, c: 'C' }],
        textOutput: 'C',
      },
    ] as any[];

    expect(
      getChordCountSummary(chords, 'A', true, true, 'all', 'all', 'all'),
    ).toEqual({
      totalCount: 3,
      filteredCount: 1,
    });
  });

  it('counts everything when nothing filters', () => {
    const chords = [row('a', 'x'), row('b', 'y')];
    expect(
      getChordCountSummary(
        chords as never,
        '',
        true,
        true,
        'all',
        'all',
        'all',
      ),
    ).toEqual({ totalCount: 2, filteredCount: 2 });
  });

  it('counts nothing for an empty list', () => {
    expect(
      getChordCountSummary([], 'a', true, true, 'all', 'all', 'all'),
    ).toEqual({ totalCount: 0, filteredCount: 0 });
  });

  it('keeps the total when the filters leave nothing', () => {
    const chords = [row('a', 'x'), row('b', 'y')];
    expect(
      getChordCountSummary(
        chords as never,
        'zzz',
        true,
        true,
        'all',
        'all',
        'all',
      ),
    ).toEqual({ totalCount: 2, filteredCount: 0 });
  });
});

describe('matchesChordSearch', () => {
  describe('search text', () => {
    it('matches every chord for an empty or blank query', () => {
      expect(match(row('a', 'x'), '')).toBe(true);
      expect(match(row('a', 'x'), '   ')).toBe(true);
    });

    it('matches output text that contains the query', () => {
      expect(match(row('q', 'hello'), 'ell', { input: false })).toBe(true);
      expect(match(row('q', 'hello'), 'xyz', { input: false })).toBe(false);
    });

    it('matches the output text with case taken into account', () => {
      expect(match(row('q', 'Hello'), 'hello', { input: false })).toBe(false);
    });

    it('trims the query before matching', () => {
      expect(match(row('q', 'hello'), '  ell  ', { input: false })).toBe(true);
    });

    it('matches input when every character of the query is a key of the chord', () => {
      expect(match(row('abc', 'zzz'), 'ca', { output: false })).toBe(true);
      expect(match(row('abc', 'zzz'), 'abd', { output: false })).toBe(false);
    });

    it('matches input regardless of the order of the keys', () => {
      expect(match(row('abc', 'zzz'), 'cba', { output: false })).toBe(true);
    });

    it('matches input by character, so a repeated character needs only one key', () => {
      expect(match(row('ab', 'zzz'), 'aaa', { output: false })).toBe(true);
    });

    it('ignores keys that are not characters (like modifiers) when searching input', () => {
      const chord = row('a', 'zzz', {
        inputKeyLabels: [{ type: 'other', title: 'Shift' }, labelOf('a')],
      });
      expect(match(chord, 'a', { output: false })).toBe(true);
      expect(match(chord, 'Shift', { output: false })).toBe(false);
    });

    it('does not match a key that is not a character even if it carries a matching letter', () => {
      const chord = row('a', 'zzz', {
        inputKeyLabels: [{ type: 'other', c: 'a', title: 'a' }],
      });
      expect(match(chord, 'a', { output: false })).toBe(false);
    });

    it('matches when either input or output matches while both are searched', () => {
      expect(match(row('abc', 'zzz'), 'ab')).toBe(true); // input
      expect(match(row('q', 'hello'), 'ell')).toBe(true); // output
      expect(match(row('q', 'hello'), 'ab')).toBe(false);
    });

    it('does not search input when it is switched off', () => {
      expect(match(row('abc', 'zzz'), 'ab', { input: false })).toBe(false);
    });

    it('does not search output when it is switched off', () => {
      expect(match(row('q', 'hello'), 'ell', { output: false })).toBe(false);
    });

    it('matches nothing for a query when both are switched off', () => {
      expect(
        match(row('abc', 'abc'), 'ab', { input: false, output: false }),
      ).toBe(false);
    });

    it('still matches a blank query when both are switched off', () => {
      expect(match(row('a', 'a'), '', { input: false, output: false })).toBe(
        true,
      );
    });
  });

  describe('bookmark filter', () => {
    it('keeps bookmarked chords for bookmarked', () => {
      expect(
        match(row('a', 'a', { bookmarked: true }), '', {
          bookmark: 'bookmarked',
        }),
      ).toBe(true);
      expect(match(row('a', 'a'), '', { bookmark: 'bookmarked' })).toBe(false);
    });

    it('keeps the other chords for unbookmarked', () => {
      expect(
        match(row('a', 'a', { bookmarked: true }), '', {
          bookmark: 'unbookmarked',
        }),
      ).toBe(false);
      expect(match(row('a', 'a'), '', { bookmark: 'unbookmarked' })).toBe(true);
    });
  });

  describe('block filter', () => {
    it('keeps blocked chords for blocked', () => {
      expect(
        match(row('a', 'a', { blocked: true }), '', { block: 'blocked' }),
      ).toBe(true);
      expect(match(row('a', 'a'), '', { block: 'blocked' })).toBe(false);
    });

    it('keeps the other chords for unblocked', () => {
      expect(
        match(row('a', 'a', { blocked: true }), '', { block: 'unblocked' }),
      ).toBe(false);
      expect(match(row('a', 'a'), '', { block: 'unblocked' })).toBe(true);
    });
  });

  describe('dynamic library filter', () => {
    const inLib = (...hashes: string[]) =>
      row('a', 'a', {
        dynamicLibraryAncestors: hashes.map((h) => ({
          actionAndPhraseHash: h,
        })),
      });

    it('keeps every chord for all', () => {
      expect(match(inLib('h1'), '', { library: 'all' })).toBe(true);
    });

    it('keeps only chords outside any library for base', () => {
      expect(match(inLib(), '', { library: 'base' })).toBe(true);
      expect(match(inLib('h1'), '', { library: 'base' })).toBe(false);
    });

    it('keeps chords inside the chosen library, at any depth', () => {
      expect(match(inLib('h1'), '', { library: 'h1' })).toBe(true);
      expect(match(inLib('h0', 'h1'), '', { library: 'h1' })).toBe(true);
      expect(match(inLib('h2'), '', { library: 'h1' })).toBe(false);
      expect(match(inLib(), '', { library: 'h1' })).toBe(false);
    });
  });

  it('needs every filter to pass', () => {
    const chord = row('ab', 'hello', { bookmarked: true, blocked: false });
    const all = { bookmark: 'bookmarked', block: 'unblocked' } as const;
    expect(match(chord, 'ell', all)).toBe(true);
    expect(match(chord, 'nope', all)).toBe(false);
    expect(match(chord, 'ell', { ...all, block: 'blocked' })).toBe(false);
    expect(match(chord, 'ell', { ...all, bookmark: 'unbookmarked' })).toBe(
      false,
    );
    expect(match(chord, 'ell', { ...all, library: 'h1' })).toBe(false);
  });
});

describe('ChordsPageComponent', () => {
  const WORDS = ['the', 'and', 'zzq', 'zzr'];
  let page: ChordsPageComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ChordsPageComponent>>;
  let chordStore: InstanceType<typeof ChordStore>;
  let labels: InstanceType<typeof ChordLabelStore>;
  let filter: InstanceType<typeof ChordFilterStore>;
  let searchSetting: InstanceType<typeof ChordSearchSettingStore>;
  let language: InstanceType<typeof LanguageSettingStore>;
  let dialogOpen: jasmine.Spy;
  let loadFromDevice: jasmine.Spy;
  let hashes: Record<string, string>;
  let ids: Record<string, number>;

  type Internals = {
    gridApi: GridApi;
    selectedIdList: { (): number[]; set(v: number[]): void };
    selectedChords: () => { id: number }[];
  };
  const internals = () => page as unknown as Internals;
  const el = () => fixture.nativeElement as HTMLElement;
  /** The button that loads from the device (the filter button also is an icon button). */
  const loadButton = () =>
    Array.from(el().querySelectorAll('button[mat-icon-button]')).find((b) =>
      b.textContent?.includes('keyboard_external_input'),
    ) as HTMLButtonElement | undefined;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    // The table applies rows and selection in timers of its own.
    await new Promise((resolve) => setTimeout(resolve, 30));
    fixture.detectChanges();
  }
  /** Selects chords through the table itself, as a user clicking rows does. */
  async function select(...words: string[]) {
    const wanted = new Set(words.map((w) => String(ids[w])));
    internals().gridApi.forEachNode((n) => n.setSelected(wanted.has(n.id!)));
    await settle();
  }

  async function create(words: string[] = WORDS) {
    localStorage.clear();
    TestBed.resetTestingModule();
    dialogOpen = jasmine.createSpy('open');
    loadFromDevice = jasmine.createSpy('load');
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: OperatingSystemService,
          useValue: { getOS: () => 'Windows' },
        },
        {
          provide: QuickSettingService,
          useValue: { loadDeviceLayoutAndChordsFromDevice: loadFromDevice },
        },
      ],
    });
    TestBed.overrideProvider(MatDialog, { useValue: { open: dialogOpen } });
    chordStore = TestBed.inject(ChordStore);
    labels = TestBed.inject(ChordLabelStore);
    filter = TestBed.inject(ChordFilterStore);
    searchSetting = TestBed.inject(ChordSearchSettingStore);
    language = TestBed.inject(LanguageSettingStore);
    language.set('uiLanguage', UiLanguage.EN);
    const chords = words.map((w, i) => makeWordChord(w, i));
    hashes = {};
    ids = {};
    words.forEach((w, i) => {
      hashes[w] = chords[i].actionAndPhraseHash;
      ids[w] = chords[i].id;
    });
    patchState(chordStore, setAllEntities(chords));
    fixture = TestBed.createComponent(ChordsPageComponent);
    page = fixture.componentInstance;
    await settle();
    await settle();
  }

  beforeEach(() => create());

  afterEach(() => fixture.destroy());

  describe('table', () => {
    it('has a row for every chord, found by chord id', () => {
      expect(page.chordDataListWithLabelStateAndStatistic().length).toBe(4);
      expect(page.getRowId({ data: { id: 42 } } as never)).toBe('42');
    });

    it('creates the table api once the table is ready', () => {
      expect(internals().gridApi).toBeDefined();
    });
  });

  describe('chord count', () => {
    const summary = () => page.chordCountSummary();

    it('starts with every chord counted', () => {
      expect(summary()).toEqual({ totalCount: 4, filteredCount: 4 });
    });

    it('follows the search query', () => {
      filter.setSearchQuery('zz');
      expect(summary()).toEqual({ totalCount: 4, filteredCount: 2 });
    });

    it('follows the bookmark filter', () => {
      labels.bookmarkChord({ actionAndPhraseHash: hashes['the'] } as never);
      filter.setBookmarkFilter('bookmarked');
      expect(summary().filteredCount).toBe(1);
    });

    it('follows the block filter', () => {
      labels.blockChord({ actionAndPhraseHash: hashes['the'] } as never);
      filter.setBlockFilter('unblocked');
      expect(summary().filteredCount).toBe(3);
    });

    it('follows the search settings', () => {
      filter.setSearchQuery('zz');
      searchSetting.set('chordOutput', false);
      searchSetting.set('chordInput', true);
      expect(summary().filteredCount).toBe(0); // "zz" are not keys of any chord
    });

    it('shows the counts in the page', async () => {
      filter.setSearchQuery('zz');
      await settle();
      expect(el().textContent).toContain('chords-page.table-count-summary');
    });
  });

  describe('table filter', () => {
    it('is not used while nothing is filtered', () => {
      expect(page.isExternalFilterPresent()).toBe(false);
    });

    it('is used for a search query, but not for a blank one', () => {
      filter.setSearchQuery('a');
      expect(page.isExternalFilterPresent()).toBe(true);
      filter.setSearchQuery('   ');
      expect(page.isExternalFilterPresent()).toBe(false);
    });

    for (const [name, apply] of [
      ['bookmark', () => filter.setBookmarkFilter('bookmarked')],
      ['block', () => filter.setBlockFilter('blocked')],
      ['dynamic library', () => filter.setDynamicLibraryFilter('base')],
    ] as [string, () => void][]) {
      it(`is used for a ${name} filter`, () => {
        apply();
        expect(page.isExternalFilterPresent()).toBe(true);
      });
    }

    it('lets a row pass by the current search and filters', () => {
      filter.setSearchQuery('zz');
      const rows = page.chordDataListWithLabelStateAndStatistic();
      const pass = (text: string) =>
        page.doesExternalFilterPass({
          data: rows.find((r) => r.textOutput === text),
        } as never);
      expect(pass('zzq')).toBe(true);
      expect(pass('the')).toBe(false);
    });

    it('keeps out a row without data', () => {
      expect(page.doesExternalFilterPass({ data: undefined } as never)).toBe(
        false,
      );
    });

    it('asks the table to filter again when the search or a filter changes', async () => {
      const onFilterChanged = spyOn(internals().gridApi, 'onFilterChanged');
      filter.setSearchQuery('a');
      await settle();
      expect(onFilterChanged).toHaveBeenCalledTimes(1);
      filter.setBlockFilter('blocked');
      await settle();
      expect(onFilterChanged).toHaveBeenCalledTimes(2);
      searchSetting.set('chordOutput', false);
      await settle();
      expect(onFilterChanged).toHaveBeenCalledTimes(3);
    });

    it('really leaves out the rows that do not pass', async () => {
      expect(internals().gridApi.getDisplayedRowCount()).toBe(4);
      filter.setSearchQuery('zz');
      await settle();
      expect(internals().gridApi.getDisplayedRowCount()).toBe(2);
      filter.setSearchQuery('');
      await settle();
      expect(internals().gridApi.getDisplayedRowCount()).toBe(4);
    });
  });

  describe('selection', () => {
    it('is empty at first, with the load button and no chip', () => {
      expect(page.selectedChordNumber()).toBe(0);
      expect(el().querySelector('mat-chip-option')).toBeNull();
      expect(loadButton()).toBeDefined();
    });

    it('follows the rows chosen in the table', async () => {
      await select('the', 'and');
      expect(page.selectedChordNumber()).toBe(2);
      expect(
        internals()
          .selectedChords()
          .map((c) => c.id)
          .sort(),
      ).toEqual([ids['the'], ids['and']].sort());
    });

    it('shows a chip with the count and hides the load button', async () => {
      await select('the');
      expect(el().querySelector('mat-chip-option')).not.toBeNull();
      expect(el().textContent).toContain(
        'chords-page.selected-chord-chip-text',
      );
      expect(loadButton()).toBeUndefined();
    });

    it('is cleared with the chip button, in the table too', async () => {
      await select('the', 'and');
      page.clearSelectedState();
      await settle();
      expect(page.selectedChordNumber()).toBe(0);
      let stillSelected = 0;
      internals().gridApi.forEachNode((n) => n.isSelected() && stillSelected++);
      expect(stillSelected).toBe(0);
    });

    it('is cleared when the chords are replaced', async () => {
      await select('the', 'and');
      patchState(
        chordStore,
        setAllEntities([makeWordChord('new', 20), makeWordChord('old', 21)]),
      );
      await settle();
      expect(page.selectedChordNumber()).toBe(0);
    });

    it('is cleared when the chords are replaced, even for a selection the table does not know', async () => {
      internals().selectedIdList.set([999999]);
      expect(page.selectedChordNumber()).toBe(1);
      patchState(chordStore, setAllEntities([makeWordChord('new', 20)]));
      await settle();
      expect(page.selectedChordNumber()).toBe(0);
    });

    it('can be set from outside the table and then shows in the table', async () => {
      internals().selectedIdList.set([ids['zzq']]);
      await settle();
      const selected: string[] = [];
      internals().gridApi.forEachNode(
        (n) => n.isSelected() && selected.push(n.id!),
      );
      expect(selected).toEqual([String(ids['zzq'])]);
    });
  });

  describe('bookmark and block of the selection', () => {
    const isBookmarked = (w: string) =>
      labels.bookmarkedHashSet().has(hashes[w]);
    const isBlocked = (w: string) => labels.blockedHashSet().has(hashes[w]);

    it('bookmarks every selected chord and no other', async () => {
      await select('the', 'and');
      page.setSelectedChordsBookmarkedState(true);
      expect(isBookmarked('the')).toBe(true);
      expect(isBookmarked('and')).toBe(true);
      expect(isBookmarked('zzq')).toBe(false);
    });

    it('removes the bookmark of selected chords only', async () => {
      labels.bookmarkChords([
        { actionAndPhraseHash: hashes['the'] },
        { actionAndPhraseHash: hashes['zzq'] },
      ] as never);
      await select('the');
      page.setSelectedChordsBookmarkedState(false);
      expect(isBookmarked('the')).toBe(false);
      expect(isBookmarked('zzq')).toBe(true);
    });

    it('blocks and unblocks the selected chords only', async () => {
      await select('the', 'and');
      page.setSelectedChordsBlockedState(true);
      expect(isBlocked('the') && isBlocked('and')).toBe(true);
      expect(isBlocked('zzq')).toBe(false);
      await select('the');
      page.setSelectedChordsBlockedState(false);
      expect(isBlocked('the')).toBe(false);
      expect(isBlocked('and')).toBe(true);
    });

    it('reports when every selected chord is bookmarked', async () => {
      labels.bookmarkChord({ actionAndPhraseHash: hashes['the'] } as never);
      await select('the', 'and');
      expect(page.isAllSelectedChordsBookmarked()).toBe(false);
      labels.bookmarkChord({ actionAndPhraseHash: hashes['and'] } as never);
      expect(page.isAllSelectedChordsBookmarked()).toBe(true);
    });

    it('reports when every selected chord is blocked', async () => {
      labels.blockChord({ actionAndPhraseHash: hashes['the'] } as never);
      await select('the', 'and');
      expect(page.isAllSelectedChordsBlocked()).toBe(false);
      labels.blockChord({ actionAndPhraseHash: hashes['and'] } as never);
      expect(page.isAllSelectedChordsBlocked()).toBe(true);
    });

    it('toggles with the icons: bookmark all when not all are, otherwise remove', async () => {
      labels.bookmarkChord({ actionAndPhraseHash: hashes['the'] } as never);
      await select('the', 'and');
      const icons = () =>
        Array.from(
          el().querySelectorAll('mat-icon.cursor-pointer'),
        ) as HTMLElement[];
      icons()[0].click(); // bookmark icon
      await settle();
      expect(isBookmarked('and')).toBe(true);
      icons()[0].click();
      await settle();
      expect(isBookmarked('the') || isBookmarked('and')).toBe(false);
    });

    it('toggles block with its icon', async () => {
      await select('the');
      const icons = Array.from(
        el().querySelectorAll('mat-icon.cursor-pointer'),
      ) as HTMLElement[];
      icons[1].click(); // block icon
      await settle();
      expect(isBlocked('the')).toBe(true);
    });
  });

  describe('custom practice', () => {
    it('opens the setting dialog with the hashes of the selected chords', async () => {
      await select('the', 'zzr');
      page.openCustomPracticeSettingDialog();
      expect(dialogOpen).toHaveBeenCalledTimes(1);
      const [component, config] = dialogOpen.calls.mostRecent().args;
      expect(component).toBe(CustomPracticeSettingDialogComponent);
      expect([...config.data.chordHashList].sort()).toEqual(
        [hashes['the'], hashes['zzr']].sort(),
      );
    });

    it('opens it from the exercise icon', async () => {
      await select('the');
      const icons = Array.from(
        el().querySelectorAll('mat-icon.cursor-pointer'),
      ) as HTMLElement[];
      icons[2].click();
      expect(dialogOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('loading from the device', () => {
    it('asks the quick setting service', async () => {
      await page.loadDeviceLayoutAndChordsFromDevice();
      expect(loadFromDevice).toHaveBeenCalledTimes(1);
    });

    it('is started by the load button', () => {
      loadButton()!.click();
      expect(loadFromDevice).toHaveBeenCalledTimes(1);
    });
  });

  describe('table language', () => {
    it('uses English by default', () => {
      expect(
        (page.localeText() as Record<string, string>)['noRowsToShow'],
      ).toBe('No Chords To Show');
    });

    it('follows the interface language', () => {
      language.set('uiLanguage', UiLanguage.ZH_TW);
      expect(
        (page.localeText() as Record<string, string>)['noRowsToShow'],
      ).toBe('沒有和弦可顯示');
      language.set('uiLanguage', UiLanguage.JP);
      expect(
        (page.localeText() as Record<string, string>)['noRowsToShow'],
      ).toBe('表示する和音がありません');
    });

    it('keeps the table texts of the language library for the other texts', () => {
      expect(Object.keys(page.localeText()).length).toBeGreaterThan(10);
    });
  });

  describe('columns', () => {
    const flat = (): ColDef[] =>
      page.colDefs.flatMap((c) => (c as ColGroupDef).children ?? [c as ColDef]);
    const column = (field: string) => flat().find((c) => c.field === field)!;
    const comparator = (field: string) =>
      column(field).comparator as (
        a: number | null,
        b: number | null,
        n1: unknown,
        n2: unknown,
        inverted: boolean,
      ) => number;

    it('have a column for every shown field', () => {
      expect(
        flat()
          .map((c) => c.field)
          .filter(Boolean),
      ).toEqual([
        'inputKeyLabels',
        'textOutput',
        'outputKeyLabels',
        'compoundAncestors',
        'dynamicLibraryAncestors',
        'adaptation.lastTenAverageChordPerMinute',
        'adaptation.correctCount',
        'realization.lastTenAverageChordPerMinute',
        'realization.correctCount',
        'accumulation.lastTenAverageChordPerMinute',
        'accumulation.correctCount',
      ]);
    });

    it('start with a column of action buttons that has no title', () => {
      expect((page.colDefs[0] as ColDef).headerName).toBe('');
      expect((page.colDefs[0] as ColDef).cellRenderer).toBeDefined();
    });

    it('use translated group titles', () => {
      expect(
        page.colDefs.slice(1).map((c) => (c as ColGroupDef).headerName),
      ).toEqual([
        'chords-page.table-column.chord',
        'chords-page.table-column.ancestors',
        'chords-page.table-column.adaptation',
        'chords-page.table-column.realization',
        'chords-page.table-column.accumulation',
      ]);
    });

    it('sort the practice numbers, with the same comparator', () => {
      const numeric = flat().filter((c) =>
        /^(adaptation|realization|accumulation)\./.test(c.field!),
      );
      expect(numeric.length).toBe(6);
      expect(numeric.every((c) => c.sortable && c.comparator)).toBe(true);
    });

    describe('comparator', () => {
      const cmp = () => comparator('adaptation.correctCount');

      it('orders numbers from small to large', () => {
        expect(cmp()(1, 3, null, null, false)).toBeLessThan(0);
        expect(cmp()(3, 1, null, null, false)).toBeGreaterThan(0);
      });

      it('treats equal values, and two missing values, as the same', () => {
        expect(cmp()(2, 2, null, null, false)).toBe(0);
        expect(cmp()(null, null, null, null, false)).toBe(0);
      });

      it('puts a missing value last when sorting up', () => {
        expect(cmp()(null, 5, null, null, false)).toBeGreaterThan(0);
        expect(cmp()(5, null, null, null, false)).toBeLessThan(0);
      });

      it('keeps a missing value last when the order is inverted', () => {
        // the grid flips the sign of the result when sorting down, so the
        // comparator flips its own sign for missing values to cancel that
        expect(cmp()(null, 5, null, null, true)).toBeLessThan(0);
        expect(cmp()(5, null, null, null, true)).toBeGreaterThan(0);
      });

      it('treats undefined like a missing value', () => {
        expect(cmp()(undefined as never, 5, null, null, false)).toBeGreaterThan(
          0,
        );
        expect(cmp()(5, undefined as never, null, null, false)).toBeLessThan(0);
      });
    });

    describe('highlight of passed chords', () => {
      const cellClass = (field: string, data: unknown) =>
        (column(field).cellClass as (p: unknown) => string)({ data });

      it('marks adaptation numbers of a chord that passed adaptation', () => {
        for (const f of [
          'adaptation.lastTenAverageChordPerMinute',
          'adaptation.correctCount',
        ]) {
          expect(cellClass(f, { adaptation: { passed: true } })).toBe(
            'bg-chara-500/20',
          );
          expect(cellClass(f, { adaptation: { passed: false } })).toBe('');
        }
      });

      it('marks realization numbers of a chord that passed realization', () => {
        for (const f of [
          'realization.lastTenAverageChordPerMinute',
          'realization.correctCount',
        ]) {
          expect(cellClass(f, { realization: { passed: true } })).toBe(
            'bg-chara-500/20',
          );
          expect(
            cellClass(f, {
              adaptation: { passed: true },
              realization: { passed: false },
            }),
          ).toBe('');
        }
      });

      it('marks nothing for a row without data', () => {
        expect(cellClass('adaptation.correctCount', undefined)).toBe('');
      });

      it('does not mark accumulation numbers, which have no pass state', () => {
        expect(column('accumulation.correctCount').cellClass).toBeUndefined();
      });
    });
  });

  describe('loading chords from a file', () => {
    const input = () =>
      el().querySelector('input[type="file"]') as HTMLInputElement;
    const pick = (text: string | null) => {
      const transfer = new DataTransfer();
      if (text !== null) {
        transfer.items.add(new File([text], 'chords.json'));
      }
      input().files = transfer.files;
    };
    const ONE = (a: number, b: number) => [
      [...Array(10).fill(0), a, b],
      [a, b],
    ];

    it('is offered in development builds, with a hidden file input', () => {
      expect(input()).not.toBeNull();
      expect(input().accept).toBe('.json');
      expect(input().classList).toContain('hidden');
    });

    it('opens the file chooser from the button', () => {
      const click = spyOn(input(), 'click');
      page.openFileSelectionDialog();
      expect(click).toHaveBeenCalled();
    });

    it('adds the chords in the file to the existing ones, unlike loading from the device which replaces them (current behavior)', async () => {
      pick(JSON.stringify({ chords: [ONE(97, 98), ONE(99, 100)] }));
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(6);
      expect(chordStore.entities().map((c) => c.output)).toContain(
        jasmine.arrayWithExactContents([97, 98]) as never,
      );
    });

    it('updates a chord that is in the file and already loaded, instead of doubling it', async () => {
      pick(JSON.stringify({ chords: [ONE(97, 98)] }));
      await page.onFileInputChange();
      const afterFirst = chordStore.entityCount();
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(afterFirst);
    });

    it('keeps the chords when no file is chosen', async () => {
      pick(null);
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(4);
    });

    it('keeps the chords when the file is empty', async () => {
      pick('');
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(4);
    });

    it('keeps the chords when the file has no chord list', async () => {
      pick(JSON.stringify({ other: 1 }));
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(4);
      pick('null');
      await page.onFileInputChange();
      expect(chordStore.entityCount()).toBe(4);
    });

    it('fails on a file that is not JSON, leaving the chords alone (current behavior)', async () => {
      pick('not json');
      await expectAsync(page.onFileInputChange()).toBeRejected();
      expect(chordStore.entityCount()).toBe(4);
    });
  });
});
