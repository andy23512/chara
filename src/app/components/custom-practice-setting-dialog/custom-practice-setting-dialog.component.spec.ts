import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { prefixStorageKey } from 'src/app/utils/store.utils';
import { CustomPracticeSettingStore } from 'src/app/stores/custom-practice-setting.store';
import { CustomPracticeSettingDialogComponent } from './custom-practice-setting-dialog.component';

describe('CustomPracticeSettingDialogComponent', () => {
  let fixture: ComponentFixture<CustomPracticeSettingDialogComponent>;
  let store: InstanceType<typeof CustomPracticeSettingStore>;
  let close: jasmine.Spy;
  let navigate: jasmine.Spy;

  const radios = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('input[type="radio"]'),
    ) as HTMLInputElement[];
  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('mat-dialog-actions button'),
    ) as HTMLButtonElement[];
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function create(saved?: object) {
    localStorage.clear();
    if (saved) {
      localStorage.setItem(
        prefixStorageKey('customPracticeSetting'),
        JSON.stringify(saved),
      );
    }
    TestBed.resetTestingModule();
    close = jasmine.createSpy('close');
    navigate = jasmine.createSpy('navigate');
    await TestBed.configureTestingModule({
      imports: [CustomPracticeSettingDialogComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: { close } },
        { provide: Router, useValue: { navigate } },
        { provide: MAT_DIALOG_DATA, useValue: { chordHashList: ['h1', 'h2'] } },
      ],
    }).compileComponents();
    store = TestBed.inject(CustomPracticeSettingStore);
    fixture = TestBed.createComponent(CustomPracticeSettingDialogComponent);
    await settle();
  }

  beforeEach(() => create());

  it('offers the two ways to show hints, in order', () => {
    expect(radios().length).toBe(2);
    expect(radios().map((r) => r.value)).toEqual(['always', 'timeout']);
  });

  it('starts with the saved choice (timeout by default)', () => {
    expect(radios().map((r) => r.checked)).toEqual([false, true]);
  });

  it('starts with a choice that was saved earlier', async () => {
    await create({ hintDisplayMode: 'always' });
    expect(radios().map((r) => r.checked)).toEqual([true, false]);
  });

  it('saves the choice when another way is picked', async () => {
    radios()[0].click();
    await settle();
    expect(store.hintDisplayMode()).toBe('always');
    expect(radios().map((r) => r.checked)).toEqual([true, false]);
  });

  describe('enter button', () => {
    it('closes the dialog and goes to the custom practice page with the chords and the mode', () => {
      buttons()[1].click();
      expect(close).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledOnceWith(['custom-practice'], {
        queryParams: {
          chordHashListJson: '["h1","h2"]',
          hintDisplayMode: 'timeout',
        },
      });
    });

    it('uses the mode that was just picked', async () => {
      radios()[0].click();
      await settle();
      buttons()[1].click();
      expect(
        navigate.calls.mostRecent().args[1].queryParams.hintDisplayMode,
      ).toBe('always');
    });
  });

  it('does not go anywhere on its own', () => {
    expect(navigate).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
