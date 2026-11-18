import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { QuickSettingService } from './quick-setting.service';
import { SerialHandlerService } from './serial-handler.service';

describe('QuickSettingService', () => {
  let calls: string[];
  let serial: Record<string, jasmine.Spy>;
  let snackBar: { open: jasmine.Spy };
  let service: QuickSettingService;

  beforeEach(() => {
    calls = [];
    const track = (name: string, fail = false) =>
      jasmine.createSpy(name).and.callFake(async (...args: unknown[]) => {
        calls.push(name + (args.length ? JSON.stringify(args) : ''));
        if (fail) throw new Error(name + ' failed');
      });
    serial = {
      connect: track('connect'),
      loadProfileLayoutMapWithProgressSnackBar: track('layout'),
      loadChordsWithProgressSnackBar: track('chords'),
      disconnect: track('disconnect'),
    };
    snackBar = { open: jasmine.createSpy('open') };
    TestBed.configureTestingModule({
      providers: [
        { provide: SerialHandlerService, useValue: serial },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: TranslateService, useValue: { instant: (k: string) => `t:${k}` } },
      ],
    });
    service = TestBed.inject(QuickSettingService);
  });

  it('connects, loads the layout (step 1/2), loads the chords (step 2/2), then disconnects', async () => {
    await service.loadDeviceLayoutAndChordsFromDevice();
    expect(calls).toEqual([
      'connect',
      'layout[{"step":1,"total":2}]',
      'chords[{"step":2,"total":2}]',
      'disconnect',
    ]);
  });

  it('shows the finished message for 3 seconds', async () => {
    await service.loadDeviceLayoutAndChordsFromDevice();
    expect(snackBar.open).toHaveBeenCalledOnceWith(
      't:general.device-layout-and-chords-loaded-message',
      undefined,
      { duration: 3000 },
    );
  });

  it('does not show the finished message before everything is loaded', async () => {
    serial['disconnect'].and.callFake(async () => {
      expect(snackBar.open).not.toHaveBeenCalled();
    });
    await service.loadDeviceLayoutAndChordsFromDevice();
  });

  describe('when a step fails', () => {
    it('stops and passes the error on when connecting fails', async () => {
      serial['connect'].and.rejectWith(new Error('no port'));
      await expectAsync(service.loadDeviceLayoutAndChordsFromDevice()).toBeRejectedWithError('no port');
      expect(serial['loadProfileLayoutMapWithProgressSnackBar']).not.toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('does not load the chords when the layout fails', async () => {
      serial['loadProfileLayoutMapWithProgressSnackBar'].and.rejectWith(new Error('x'));
      await expectAsync(service.loadDeviceLayoutAndChordsFromDevice()).toBeRejected();
      expect(serial['loadChordsWithProgressSnackBar']).not.toHaveBeenCalled();
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    // Current behavior: the port is not closed when a load step fails.
    it('leaves the port connected when loading fails', async () => {
      serial['loadChordsWithProgressSnackBar'].and.rejectWith(new Error('x'));
      await expectAsync(service.loadDeviceLayoutAndChordsFromDevice()).toBeRejected();
      expect(serial['disconnect']).not.toHaveBeenCalled();
    });
  });
});
