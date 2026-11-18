import { OverlayContainer } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { ChordFilterStore } from 'src/app/stores/chord-filter.store';
import { ChordFilterComponent } from './chord-filter.component';

describe('ChordFilterComponent', () => {
  let fixture: ComponentFixture<ChordFilterComponent>;
  let store: InstanceType<typeof ChordFilterStore>;
  let overlay: HTMLElement;
  const dynamicLibraries = signal<unknown[]>([]);

  type Internals = {
    bookmarkFilterOptions: { value: string; label: string }[];
    blockFilterOptions: { value: string; label: string }[];
    dynamicLibraryFilterOptions: () => { value: string; label: string }[];
    isFilterOpen: boolean;
  };
  const internals = () => fixture.componentInstance as unknown as Internals;
  const triggerButton = () =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const icon = () =>
    fixture.nativeElement.querySelector('mat-icon') as HTMLElement;
  const selects = () =>
    Array.from(overlay.querySelectorAll('mat-select')) as HTMLElement[];
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    dynamicLibraries.set([]);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ChordFilterComponent],
      providers: [
        provideTranslateService(),
        { provide: ChordDataService, useValue: { dynamicLibraries } },
      ],
    }).compileComponents();
    store = TestBed.inject(ChordFilterStore);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(ChordFilterComponent);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    overlay.innerHTML = '';
  });

  describe('panel', () => {
    it('is closed at first', () => {
      expect(selects().length).toBe(0);
    });

    it('opens with the button, with one select for each filter', async () => {
      triggerButton().click();
      await settle();
      expect(selects().length).toBe(3);
    });

    it('closes with the same button', async () => {
      triggerButton().click();
      await settle();
      triggerButton().click();
      await settle();
      expect(selects().length).toBe(0);
    });
  });

  describe('button highlight', () => {
    const highlighted = () => icon().classList.contains('!text-chara-500');

    it('is off without any filter', () => {
      expect(highlighted()).toBe(false);
    });

    for (const [name, apply] of [
      ['a bookmark filter', () => store.setBookmarkFilter('bookmarked')],
      ['a block filter', () => store.setBlockFilter('unblocked')],
      ['a dynamic library filter', () => store.setDynamicLibraryFilter('base')],
    ] as [string, () => void][]) {
      it(`is on with ${name}`, async () => {
        apply();
        await settle();
        expect(highlighted()).toBe(true);
      });
    }

    it('is not turned on by a search query, which has its own box', async () => {
      store.setSearchQuery('abc');
      await settle();
      expect(highlighted()).toBe(false);
    });

    it('goes off again when the filters are back to all', async () => {
      store.setBlockFilter('blocked');
      await settle();
      store.setBlockFilter('all');
      await settle();
      expect(highlighted()).toBe(false);
    });
  });

  describe('options', () => {
    it('offer all, bookmarked and unbookmarked for the bookmark filter', () => {
      expect(internals().bookmarkFilterOptions.map((o) => o.value)).toEqual([
        'all',
        'bookmarked',
        'unbookmarked',
      ]);
      expect(internals().bookmarkFilterOptions[1].label).toBe(
        'chord-filter.bookmark-filter.bookmarked',
      );
    });

    it('offer all, blocked and unblocked for the block filter', () => {
      expect(internals().blockFilterOptions.map((o) => o.value)).toEqual([
        'all',
        'blocked',
        'unblocked',
      ]);
      expect(internals().blockFilterOptions[2].label).toBe(
        'chord-filter.block-filter.unblocked',
      );
    });

    it('offer all and base for the dynamic library filter when there is no library', () => {
      expect(internals().dynamicLibraryFilterOptions()).toEqual([
        { value: 'all', label: 'chord-filter.dynamic-library-filter.all' },
        { value: 'base', label: 'chord-filter.dynamic-library-filter.base' },
      ]);
    });

    it('add each dynamic library, named by its path of ancestors', () => {
      dynamicLibraries.set([
        {
          actionAndPhraseHash: 'h1',
          textOutput: 'Lib',
          dynamicLibraryAncestors: [],
        },
        {
          actionAndPhraseHash: 'h2',
          textOutput: 'Inner',
          dynamicLibraryAncestors: [
            { textOutput: 'Lib' },
            { textOutput: 'Mid' },
          ],
        },
      ]);
      const options = internals().dynamicLibraryFilterOptions();
      expect(options.slice(2)).toEqual([
        { value: 'h1', label: 'Lib' },
        { value: 'h2', label: 'Lib > Mid > Inner' },
      ]);
    });

    it('follow libraries that are added later', () => {
      expect(internals().dynamicLibraryFilterOptions().length).toBe(2);
      dynamicLibraries.set([
        {
          actionAndPhraseHash: 'h1',
          textOutput: 'Lib',
          dynamicLibraryAncestors: [],
        },
      ]);
      expect(internals().dynamicLibraryFilterOptions().length).toBe(3);
    });
  });

  describe('filters', () => {
    const call = (name: string, value: string) =>
      (
        fixture.componentInstance as unknown as Record<
          string,
          (v: string) => void
        >
      )[name](value);

    it('write the bookmark filter to the store', () => {
      call('setBookmarkFilter', 'unbookmarked');
      expect(store.bookmarkFilter()).toBe('unbookmarked');
    });

    it('write the block filter to the store', () => {
      call('setBlockFilter', 'blocked');
      expect(store.blockFilter()).toBe('blocked');
    });

    it('write the dynamic library filter to the store', () => {
      call('setDynamicLibraryFilter', 'h2');
      expect(store.dynamicLibraryFilter()).toBe('h2');
    });

    it('do not change each other', () => {
      call('setBookmarkFilter', 'bookmarked');
      call('setBlockFilter', 'blocked');
      expect(store.bookmarkFilter()).toBe('bookmarked');
      expect(store.dynamicLibraryFilter()).toBe('all');
    });
  });
});
