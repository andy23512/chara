import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';
import { createPage, PracticeFixture } from '../practice-fixtures.spec';
import { CustomPracticePageComponent } from './custom-practice-page.component';

describe('CustomPracticePageComponent', () => {
  let page: PracticeFixture<CustomPracticePageComponent>;
  const WORDS = ['the', 'and', 'zzq'];
  const groups = () =>
    (
      page.component as unknown as {
        chordGroups: () => {
          textOutput: string;
          englishWordRank: number;
          bookmarked: boolean;
          nonBlockedChords: { id: string }[];
        }[];
      }
    ).chordGroups();

  function setup(hashesOf: string[] | string, words = WORDS) {
    // The hashes can only be read after the chords exist, so make the page twice.
    const probe = createPage(CustomPracticePageComponent, words, {
      chordHashListJson: '[]',
      hintDisplayMode: 'always',
    });
    const list =
      typeof hashesOf === 'string'
        ? hashesOf
        : JSON.stringify(
            hashesOf.map((w) => probe.chords[w].actionAndPhraseHash),
          );
    page = createPage(CustomPracticePageComponent, words, {
      chordHashListJson: list,
      hintDisplayMode: 'always',
    });
  }

  it('practices only the chosen chords', () => {
    setup(['the', 'zzq']);
    expect(
      groups()
        .map((g) => g.textOutput)
        .sort(),
    ).toEqual(['the', 'zzq']);
  });

  it('is empty for an empty list', () => {
    setup([]);
    expect(groups()).toEqual([]);
  });

  it('ignores hashes that match no chord', () => {
    setup('["no|such|chord"]');
    expect(groups()).toEqual([]);
  });

  it('does not rank or bookmark the groups, to keep the order the user chose', () => {
    setup(['the', 'zzq']);
    for (const g of groups()) {
      expect(g.englishWordRank).toBe(0);
      expect(g.bookmarked).toBe(false);
    }
  });

  it('follows the chosen chords even when they are blocked (current behavior)', () => {
    const probe = createPage(CustomPracticePageComponent, WORDS, {
      chordHashListJson: '[]',
      hintDisplayMode: 'always',
    });
    const hash = probe.chords['the'].actionAndPhraseHash;
    page = createPage(CustomPracticePageComponent, WORDS, {
      chordHashListJson: JSON.stringify([hash]),
      hintDisplayMode: 'always',
    });
    page.block('the');
    expect(groups().map((g) => g.textOutput)).toEqual(['the']);
  });

  describe('with a chord list that cannot be used', () => {
    const message = 'custom-practice-page.invalid-chord-list';
    let open: jasmine.Spy;

    function setupBroken(list: string) {
      TestBed.resetTestingModule();
      open = jasmine.createSpy('open');
      TestBed.configureTestingModule({
        providers: [
          { provide: MatSnackBar, useValue: { open } },
          provideTranslateService(),
        ],
      });
      page = createPage(
        CustomPracticePageComponent,
        WORDS,
        {
          chordHashListJson: list,
          hintDisplayMode: 'always',
        },
        false,
      );
      TestBed.tick();
    }

    for (const list of ['not json', '5', '{"a":1}', '[1, 2]', 'null', '']) {
      it(`shows an error and practices nothing for ${JSON.stringify(list)}`, () => {
        setupBroken(list);
        expect(open).toHaveBeenCalledTimes(1);
        expect(open.calls.mostRecent().args[0]).toBe(message);
        expect(open.calls.mostRecent().args[2]).toEqual({ duration: 5000 });
        expect(groups()).toEqual([]);
      });
    }

    it('shows no error for a usable list, including an empty one', () => {
      setupBroken('[]');
      expect(open).not.toHaveBeenCalled();
      expect(groups()).toEqual([]);
    });
  });
});
