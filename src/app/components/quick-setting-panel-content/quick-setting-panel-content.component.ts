import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatList,
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
} from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { SerialHandlerService } from 'src/app/services/serial-handler.service';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { FlatChordTreeNodeStore } from 'src/app/stores/flat-chord-tree-node.store';

interface QuickSetting {
  name: string;
  deviceLayoutId: string;
  layoutThumb3SwitchVisibility: boolean;
}

@Component({
  selector: 'app-quick-setting-panel-content',
  templateUrl: './quick-setting-panel-content.component.html',
  standalone: true,
  imports: [
    MatButton,
    TranslatePipe,
    MatList,
    MatListItem,
    MatListItemIcon,
    IconGuardPipe,
    MatIcon,
    MatListItemTitle,
  ],
})
export class QuickSettingPanelContentComponent {
  private readonly serialHandlerService = inject(SerialHandlerService);
  private readonly translateService = inject(TranslateService);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly flatChordTreeNodeStore = inject(FlatChordTreeNodeStore);

  public isDeviceLayoutLoaded =
    this.deviceLayoutStore.hasLoadedProfileLayoutMap;
  public chordCount = this.flatChordTreeNodeStore.entityCount;

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
