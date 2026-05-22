import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { SerialHandlerService } from './serial-handler.service';

@Injectable({ providedIn: 'root' })
export class QuickSettingService {
  private readonly serialHandlerService = inject(SerialHandlerService);
  private readonly translateService = inject(TranslateService);
  private readonly matSnackBar = inject(MatSnackBar);

  public async loadDeviceLayoutAndChordsFromDevice() {
    await this.serialHandlerService.connect();
    await this.serialHandlerService.loadProfileLayoutMapWithProgressSnackBar({
      step: 1,
      total: 2,
    });
    await this.serialHandlerService.loadChordsWithProgressSnackBar({
      step: 2,
      total: 2,
    });
    await this.serialHandlerService.disconnect();
    this.matSnackBar.open(
      this.translateService.instant(
        'quick-setting.device-layout-and-chords-loaded-message',
      ),
      undefined,
      { duration: 3000 },
    );
  }
}
