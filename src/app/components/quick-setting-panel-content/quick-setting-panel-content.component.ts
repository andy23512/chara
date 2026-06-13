import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatList,
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
} from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { QuickSettingService } from 'src/app/services/quick-setting.service';
import { ChordStore } from 'src/app/stores/chord.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';

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
  private readonly quickSettingService = inject(QuickSettingService);
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly chordStore = inject(ChordStore);

  public isDeviceLayoutLoaded =
    this.deviceLayoutStore.hasLoadedProfileLayoutMap;
  public chordCount = this.chordStore.entityCount;

  public loadDeviceLayoutAndChordsFromDevice() {
    this.quickSettingService.loadDeviceLayoutAndChordsFromDevice();
  }
}
