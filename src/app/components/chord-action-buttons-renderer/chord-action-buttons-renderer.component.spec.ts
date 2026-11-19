import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { ICellRendererParams } from 'ag-grid-community';
import { provideTranslateService } from '@ngx-translate/core';
import { ChordDataWithLabelState } from 'src/app/models/chord.models';
import { ChordLabelStore } from 'src/app/stores/chord-label.store';
import { ChordActionButtonsRendererComponent } from './chord-action-buttons-renderer.component';

const chord = (
  hash: string,
  state: Partial<ChordDataWithLabelState> = {},
): ChordDataWithLabelState =>
  ({
    actionAndPhraseHash: hash,
    bookmarked: false,
    blocked: false,
    ...state,
  }) as ChordDataWithLabelState;
const params = (data: ChordDataWithLabelState) =>
  ({ node: { data } }) as unknown as ICellRendererParams;

describe('ChordActionButtonsRendererComponent', () => {
  let fixture: ComponentFixture<ChordActionButtonsRendererComponent>;
  let component: ChordActionButtonsRendererComponent;
  let store: InstanceType<typeof ChordLabelStore>;

  const icons = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('mat-icon'),
    ) as HTMLElement[];
  const bookmarkIcon = () => icons()[0];
  const blockIcon = () => icons()[1];

  function render(data: ChordDataWithLabelState) {
    component.agInit(params(data));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ChordActionButtonsRendererComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    store = TestBed.inject(ChordLabelStore);
    fixture = TestBed.createComponent(ChordActionButtonsRendererComponent);
    component = fixture.componentInstance;
  });

  it('shows a bookmark icon and a block icon', () => {
    render(chord('h'));
    expect(bookmarkIcon().textContent?.trim()).toBe('bookmark');
    expect(blockIcon().textContent?.trim()).toBe('block');
  });

  it('dims both icons for a plain chord', () => {
    render(chord('h'));
    expect(bookmarkIcon().classList).toContain('opacity-20');
    expect(blockIcon().classList).toContain('opacity-20');
    expect(bookmarkIcon().classList).not.toContain('text-chara-500');
    expect(blockIcon().classList).not.toContain('text-red-500');
  });

  it('highlights the bookmark icon for a bookmarked chord', () => {
    render(chord('h', { bookmarked: true }));
    expect(bookmarkIcon().classList).toContain('text-chara-500');
    expect(bookmarkIcon().classList).not.toContain('opacity-20');
    expect(blockIcon().classList).toContain('opacity-20');
  });

  it('highlights the block icon for a blocked chord', () => {
    render(chord('h', { blocked: true }));
    expect(blockIcon().classList).toContain('text-red-500');
    expect(blockIcon().classList).not.toContain('opacity-20');
    expect(bookmarkIcon().classList).toContain('opacity-20');
  });

  it('clicking bookmark bookmarks an unbookmarked chord', () => {
    render(chord('h'));
    bookmarkIcon().click();
    expect(store.bookmarkedHashes()).toEqual(['h']);
    expect(store.blockedHashes()).toEqual([]);
  });

  it('clicking bookmark unbookmarks a bookmarked chord', () => {
    store.bookmarkChord(chord('h'));
    store.bookmarkChord(chord('other'));
    render(chord('h', { bookmarked: true }));
    bookmarkIcon().click();
    expect(store.bookmarkedHashes()).toEqual(['other']);
  });

  it('clicking block blocks an unblocked chord', () => {
    render(chord('h'));
    blockIcon().click();
    expect(store.blockedHashes()).toEqual(['h']);
    expect(store.bookmarkedHashes()).toEqual([]);
  });

  it('clicking block unblocks a blocked chord', () => {
    store.blockChord(chord('h'));
    store.blockChord(chord('other'));
    render(chord('h', { blocked: true }));
    blockIcon().click();
    expect(store.blockedHashes()).toEqual(['other']);
  });

  it('uses the bookmark/block tooltip keys that match the state', () => {
    const tip = (i: number) =>
      icons()[i]
        ? fixture.debugElement
            .queryAll(By.directive(MatTooltip))
            [i].injector.get(MatTooltip).message
        : '';
    render(chord('h'));
    expect(tip(0)).toBe('chords-page.bookmark-single');
    expect(tip(1)).toBe('chords-page.block-single');
    render(chord('h', { bookmarked: true, blocked: true }));
    fixture.componentInstance.refresh(
      params(chord('h', { bookmarked: true, blocked: true })),
    );
    fixture.detectChanges();
    expect(tip(0)).toBe('chords-page.unbookmark-single');
    expect(tip(1)).toBe('chords-page.unblock-single');
  });

  it('refresh takes the new row data and returns true', () => {
    render(chord('h'));
    expect(
      component.refresh(params(chord('h', { bookmarked: true }))),
    ).toBeTrue();
    fixture.detectChanges();
    expect(component.chord.bookmarked).toBeTrue();
    expect(bookmarkIcon().classList).toContain('text-chara-500');
  });
});
