import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
} from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Chord, convertChordInNumberListFormToChord } from 'tangent-cc-lib';
import { ChordStore } from 'src/app/stores/chord.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { DeleteChordsConfirmDialogComponent } from '../delete-chords-confirm-dialog/delete-chords-confirm-dialog.component';
import { DeleteDeviceLayoutConfirmDialogComponent } from '../delete-device-layout-confirm-dialog/delete-device-layout-confirm-dialog.component';
import { DataDeletionSettingPanelContentComponent } from './data-deletion-setting-panel-content.component';

const chord = (a: number, b: number): Chord =>
  convertChordInNumberListFormToChord([
    [...Array(10).fill(0), a, b],
    [a, b],
  ]);

describe('DataDeletionSettingPanelContentComponent', () => {
  let fixture: ComponentFixture<DataDeletionSettingPanelContentComponent>;
  let chords: InstanceType<typeof ChordStore>;
  let layout: InstanceType<typeof DeviceLayoutStore>;
  let open: jasmine.Spy;
  let snackOpen: jasmine.Spy;
  let dialogResult: unknown;

  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
  const LAYOUT_BUTTON = 0;
  const CHORDS_BUTTON = 1;
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const loadData = () => {
    patchState(chords, setAllEntities([chord(97, 98), chord(99, 100)]));
    layout.setProfileLayoutMap({ A: [[1], [1], [1]] } as never);
  };

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    dialogResult = { confirmed: true };
    open = jasmine
      .createSpy('open')
      .and.callFake(() => ({ afterClosed: () => of(dialogResult) }));
    snackOpen = jasmine.createSpy('snackOpen');
    await TestBed.configureTestingModule({
      imports: [DataDeletionSettingPanelContentComponent],
      providers: [
        provideTranslateService(),
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    })
      .overrideComponent(DataDeletionSettingPanelContentComponent, {
        add: { providers: [{ provide: MatDialog, useValue: { open } }] },
      })
      .compileComponents();
    chords = TestBed.inject(ChordStore);
    layout = TestBed.inject(DeviceLayoutStore);
    fixture = TestBed.createComponent(DataDeletionSettingPanelContentComponent);
    await settle();
  });

  it('disables both buttons when there is nothing to delete', () => {
    expect(buttons()[LAYOUT_BUTTON].disabled).toBe(true);
    expect(buttons()[CHORDS_BUTTON].disabled).toBe(true);
  });

  it('enables each button when its data is loaded', async () => {
    layout.setProfileLayoutMap({ A: [[1], [1], [1]] } as never);
    await settle();
    expect(buttons()[LAYOUT_BUTTON].disabled).toBe(false);
    expect(buttons()[CHORDS_BUTTON].disabled).toBe(true);
    patchState(chords, setAllEntities([chord(97, 98)]));
    await settle();
    expect(buttons()[CHORDS_BUTTON].disabled).toBe(false);
  });

  describe('deleting the device layout', () => {
    beforeEach(async () => {
      loadData();
      await settle();
    });

    it('asks first, with the layout confirm dialog', () => {
      buttons()[LAYOUT_BUTTON].click();
      expect(open).toHaveBeenCalledOnceWith(
        DeleteDeviceLayoutConfirmDialogComponent,
      );
    });

    it('deletes the layout when confirmed, keeps the chords, and says so', async () => {
      buttons()[LAYOUT_BUTTON].click();
      await settle();
      expect(layout.hasLoadedProfileLayoutMap()).toBe(false);
      expect(chords.entityCount()).toBe(2);
      expect(snackOpen).toHaveBeenCalledOnceWith(
        'data-deletion-setting.device-layout-deleted',
        undefined,
        { duration: 2000 },
      );
    });

    it('keeps everything when the dialog answers without confirming', () => {
      dialogResult = { confirmed: false };
      buttons()[LAYOUT_BUTTON].click();
      expect(layout.hasLoadedProfileLayoutMap()).toBe(true);
      expect(snackOpen).not.toHaveBeenCalled();
    });

    it('keeps everything when the dialog is cancelled (no answer at all)', fakeAsync(() => {
      dialogResult = undefined;
      buttons()[LAYOUT_BUTTON].click();
      // An error inside a subscription is raised in a timer, so run the timers.
      expect(() => flush()).not.toThrow();
      expect(layout.hasLoadedProfileLayoutMap()).toBe(true);
      expect(snackOpen).not.toHaveBeenCalled();
    }));
  });

  describe('deleting the chords', () => {
    beforeEach(async () => {
      loadData();
      await settle();
    });

    it('asks first, with the chords confirm dialog', () => {
      buttons()[CHORDS_BUTTON].click();
      expect(open).toHaveBeenCalledOnceWith(DeleteChordsConfirmDialogComponent);
    });

    it('deletes all chords when confirmed, keeps the layout, and says so', async () => {
      buttons()[CHORDS_BUTTON].click();
      await settle();
      expect(chords.entityCount()).toBe(0);
      expect(layout.hasLoadedProfileLayoutMap()).toBe(true);
      expect(snackOpen).toHaveBeenCalledOnceWith(
        'data-deletion-setting.chords-deleted',
        undefined,
        { duration: 2000 },
      );
      expect(buttons()[CHORDS_BUTTON].disabled).toBe(true);
    });

    it('keeps everything when the dialog answers without confirming', () => {
      dialogResult = { confirmed: false };
      buttons()[CHORDS_BUTTON].click();
      expect(chords.entityCount()).toBe(2);
      expect(snackOpen).not.toHaveBeenCalled();
    });

    it('keeps everything when the dialog is cancelled (no answer at all)', fakeAsync(() => {
      dialogResult = undefined;
      buttons()[CHORDS_BUTTON].click();
      // An error inside a subscription is raised in a timer, so run the timers.
      expect(() => flush()).not.toThrow();
      expect(chords.entityCount()).toBe(2);
      expect(snackOpen).not.toHaveBeenCalled();
    }));
  });
});
