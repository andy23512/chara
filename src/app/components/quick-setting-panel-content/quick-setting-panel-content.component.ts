import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SerialHandlerService } from 'src/app/services/serial-handler.service';

interface QuickSetting {
  name: string;
  deviceLayoutId: string;
  layoutThumb3SwitchVisibility: boolean;
}

@Component({
  selector: 'app-quick-setting-panel-content',
  templateUrl: './quick-setting-panel-content.component.html',
  standalone: true,
  imports: [MatButton, TranslatePipe],
})
export class QuickSettingPanelContentComponent {
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
