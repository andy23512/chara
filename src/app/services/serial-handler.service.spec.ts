import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Chord, Profile, ProfileLayoutMap } from 'tangent-cc-lib';
import { ProgressSnackBarComponent } from '../components/progress-snack-bar/progress-snack-bar.component';
import { ChordStore } from '../stores/chord.store';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { SerialHandlerService } from './serial-handler.service';
import { SerialPortHandlerService } from './serial-port-handler.service';

describe('SerialHandlerService', () => {
  let service: SerialHandlerService;
  let snackBar: { openFromComponent: jasmine.Spy; open: jasmine.Spy };
  let ref: { dismiss: jasmine.Spy; instance: { updateProgress: jasmine.Spy } };
  let layoutStore: InstanceType<typeof DeviceLayoutStore>;
  let chordStore: InstanceType<typeof ChordStore>;

  const layoutMap = { [Profile.A]: [[1, 2]] } as unknown as ProfileLayoutMap;
  const chord = {
    id: 1, parentId: null, input: [], actions: [], output: [],
    actionAndPhraseHash: 'h', isDynamicLibraryChord: false,
  } as unknown as Chord;

  beforeEach(() => {
    localStorage.clear();
    ref = { dismiss: jasmine.createSpy('dismiss'), instance: { updateProgress: jasmine.createSpy('updateProgress') } };
    snackBar = {
      openFromComponent: jasmine.createSpy('openFromComponent').and.returnValue(ref),
      open: jasmine.createSpy('open'),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBar },
        { provide: TranslateService, useValue: { instant: (k: string) => `t:${k}` } },
        { provide: SerialPortHandlerService, useValue: {} },
      ],
    });
    service = TestBed.inject(SerialHandlerService);
    layoutStore = TestBed.inject(DeviceLayoutStore);
    chordStore = TestBed.inject(ChordStore);
  });

  describe('loadProfileLayoutMapWithProgressSnackBar', () => {
    const emit = (...values: object[]) =>
      spyOn(service, 'loadProfileLayoutMap').and.returnValue(of(...values) as never);

    it('opens a progress snack bar with the loading message', async () => {
      emit({ complete: true, profileLayoutMap: layoutMap });
      await service.loadProfileLayoutMapWithProgressSnackBar();
      expect(snackBar.openFromComponent).toHaveBeenCalledOnceWith(
        ProgressSnackBarComponent,
        { data: { message: 't:general.device-layout-loading-message', progress: 0, stepInfo: undefined } },
      );
    });

    it('passes the step info on to the snack bar', async () => {
      emit({ complete: true, profileLayoutMap: layoutMap });
      await service.loadProfileLayoutMapWithProgressSnackBar({ step: 1, total: 2 });
      expect(snackBar.openFromComponent.calls.mostRecent().args[1].data.stepInfo).toEqual({ step: 1, total: 2 });
    });

    it('shows the progress as a percentage', async () => {
      emit({ complete: false, loaded: 1, total: 4 }, { complete: true, profileLayoutMap: layoutMap });
      await service.loadProfileLayoutMapWithProgressSnackBar();
      expect(ref.instance.updateProgress).toHaveBeenCalledOnceWith(25);
    });

    it('stores the layout, closes the progress bar and tells the user', async () => {
      emit({ complete: true, profileLayoutMap: layoutMap });
      await service.loadProfileLayoutMapWithProgressSnackBar();
      expect(ref.dismiss).toHaveBeenCalled();
      expect(layoutStore.profileLayoutMap()).toEqual(layoutMap);
      expect(snackBar.open).toHaveBeenCalledOnceWith(
        't:general.device-layout-loaded-message',
        undefined,
        { duration: 3000 },
      );
    });

    it('does not show its own message as one step of several', async () => {
      emit({ complete: true, profileLayoutMap: layoutMap });
      await service.loadProfileLayoutMapWithProgressSnackBar({ step: 1, total: 2 });
      expect(layoutStore.hasLoadedProfileLayoutMap()).toBe(true);
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('closes the progress bar but stores nothing when there is no layout', async () => {
      emit({ complete: true, profileLayoutMap: undefined });
      await service.loadProfileLayoutMapWithProgressSnackBar();
      expect(ref.dismiss).toHaveBeenCalled();
      expect(layoutStore.hasLoadedProfileLayoutMap()).toBe(false);
      expect(snackBar.open).not.toHaveBeenCalled();
    });
  });

  describe('loadChordsWithProgressSnackBar', () => {
    const emit = (...values: object[]) => {
      const spy = jasmine.isSpy(service.loadChords)
        ? (service.loadChords as jasmine.Spy)
        : spyOn(service, 'loadChords');
      spy.and.returnValue(of(...values) as never);
    };

    it('opens a progress snack bar with the loading message', async () => {
      emit({ complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar({ step: 2, total: 2 });
      expect(snackBar.openFromComponent).toHaveBeenCalledOnceWith(
        ProgressSnackBarComponent,
        { data: { message: 't:general.chords-loading-message', progress: 0, stepInfo: { step: 2, total: 2 } } },
      );
    });

    it('shows the progress as a percentage', async () => {
      emit({ complete: false, loaded: 50, total: 200 }, { complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar();
      expect(ref.instance.updateProgress).toHaveBeenCalledOnceWith(25);
    });

    it('stores the chords, closes the progress bar and tells the user', async () => {
      emit({ complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar();
      expect(ref.dismiss).toHaveBeenCalled();
      expect(chordStore.entityCount()).toBe(1);
      expect(snackBar.open).toHaveBeenCalledOnceWith(
        't:general.chords-loaded-message',
        undefined,
        { duration: 3000 },
      );
    });

    it('replaces the chords that were stored before', async () => {
      emit({ complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar();
      emit({ complete: true, chords: [{ ...chord, id: 2 }, { ...chord, id: 3 }] });
      await service.loadChordsWithProgressSnackBar();
      expect(chordStore.entityCount()).toBe(2);
    });

    it('does not show its own message as one step of several', async () => {
      emit({ complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar({ step: 2, total: 2 });
      expect(chordStore.entityCount()).toBe(1);
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('keeps the old chords when the device sends none', async () => {
      emit({ complete: true, chords: [chord] });
      await service.loadChordsWithProgressSnackBar();
      emit({ complete: true, chords: undefined });
      await service.loadChordsWithProgressSnackBar();
      expect(chordStore.entityCount()).toBe(1);
    });
  });
});
