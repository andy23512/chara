import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ChordFilterStore } from 'src/app/stores/chord-filter.store';
import { ChordSearchSettingStore } from 'src/app/stores/chord-search-setting.store';
import { ChordSearchComponent } from './chord-search.component';

describe('ChordSearchComponent', () => {
  let fixture: ComponentFixture<ChordSearchComponent>;
  let filter: InstanceType<typeof ChordFilterStore>;
  let setting: InstanceType<typeof ChordSearchSettingStore>;
  let overlay: HTMLElement;

  const searchInput = () =>
    fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const settingsButton = () =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const toggles = () =>
    Array.from(overlay.querySelectorAll('mat-slide-toggle')) as HTMLElement[];
  const toggleButton = (i: number) =>
    toggles()[i].querySelector('button') as HTMLButtonElement;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function openSettings() {
    settingsButton().click();
    await settle();
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ChordSearchComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    filter = TestBed.inject(ChordFilterStore);
    setting = TestBed.inject(ChordSearchSettingStore);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
    fixture = TestBed.createComponent(ChordSearchComponent);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    overlay.innerHTML = '';
  });

  describe('search box', () => {
    it('shows the current search query', async () => {
      filter.setSearchQuery('hello');
      await settle();
      expect(searchInput().value).toBe('hello');
    });

    it('writes what is typed to the filter', async () => {
      searchInput().value = 'the';
      searchInput().dispatchEvent(new Event('input'));
      await settle();
      expect(filter.searchQuery()).toBe('the');
      expect(filter.hasActiveSearchFilter()).toBe(true);
    });

    it('clears the filter when the box is emptied', async () => {
      filter.setSearchQuery('x');
      await settle();
      searchInput().value = '';
      searchInput().dispatchEvent(new Event('input'));
      await settle();
      expect(filter.searchQuery()).toBe('');
      expect(filter.hasActiveSearchFilter()).toBe(false);
    });
  });

  describe('search settings', () => {
    it('are hidden until the button is pressed', () => {
      expect(toggles().length).toBe(0);
    });

    it('open with the button and close with the same button', async () => {
      await openSettings();
      expect(toggles().length).toBe(2);
      settingsButton().click();
      await settle();
      expect(toggles().length).toBe(0);
    });

    it('show the current settings', async () => {
      setting.set('chordOutput', false);
      await openSettings();
      expect(toggleButton(0).getAttribute('aria-checked')).toBe('true');
      expect(toggleButton(1).getAttribute('aria-checked')).toBe('false');
    });

    it('write a changed toggle to the setting', async () => {
      await openSettings();
      toggleButton(0).click();
      await settle();
      expect(setting.chordInput()).toBe(false);
      expect(setting.chordOutput()).toBe(true);
    });

    it('keep the only enabled toggle locked so one search target always stays', async () => {
      setting.set('chordOutput', false);
      await openSettings();
      expect(toggleButton(0).disabled).toBe(true); // the only one on
      expect(toggleButton(1).disabled).toBe(false);
    });

    it('lock nothing while both are on', async () => {
      await openSettings();
      expect(toggleButton(0).disabled).toBe(false);
      expect(toggleButton(1).disabled).toBe(false);
    });

    it('unlock again once the other toggle is turned on', async () => {
      setting.set('chordOutput', false);
      await openSettings();
      toggleButton(1).click();
      await settle();
      expect(setting.chordOutput()).toBe(true);
      expect(toggleButton(0).disabled).toBe(false);
    });
  });

  it('writes a setting through onChordSearchSettingChange', () => {
    fixture.componentInstance.onChordSearchSettingChange('chordInput', false);
    expect(setting.chordInput()).toBe(false);
  });
});
