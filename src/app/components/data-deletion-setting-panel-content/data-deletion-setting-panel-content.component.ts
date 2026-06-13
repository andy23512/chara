import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState } from '@ngrx/signals';
import { removeAllEntities } from '@ngrx/signals/entities';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { SentenceCasePipe } from 'src/app/pipes/sentence-case.pipe';
import { ChordStore } from 'src/app/stores/chord.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { DeleteChordsConfirmDialogComponent } from '../delete-chords-confirm-dialog/delete-chords-confirm-dialog.component';
import { DeleteDeviceLayoutConfirmDialogComponent } from '../delete-device-layout-confirm-dialog/delete-device-layout-confirm-dialog.component';

@Component({
  selector: 'app-data-deletion-setting-panel-content',
  templateUrl: 'data-deletion-setting-panel-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton, IconGuardPipe, MatIcon, TranslatePipe, SentenceCasePipe],
})
export class DataDeletionSettingPanelContentComponent {
  private readonly matDialog = inject(MatDialog);
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly chordStore = inject(ChordStore);
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly translateService = inject(TranslateService);

  public isDeviceLayoutLoaded =
    this.deviceLayoutStore.hasLoadedProfileLayoutMap;
  public chordCount = this.chordStore.entityCount;

  public openDeleteDeviceLayoutConfirmDialog() {
    this.matDialog
      .open(DeleteDeviceLayoutConfirmDialogComponent)
      .afterClosed()
      .subscribe((response) => {
        if (response.confirmed) {
          this.deviceLayoutStore.deleteProfileLayoutMap();
          this.matSnackBar.open(
            this.translateService.instant(
              'data-deletion-setting.device-layout-deleted',
            ),
            undefined,
            { duration: 2000 },
          );
        }
      });
  }

  public openDeleteChordsConfirmDialog() {
    this.matDialog
      .open(DeleteChordsConfirmDialogComponent)
      .afterClosed()
      .subscribe((response) => {
        if (response.confirmed) {
          patchState(this.chordStore, removeAllEntities());
          this.matSnackBar.open(
            this.translateService.instant(
              'data-deletion-setting.chords-deleted',
            ),
            undefined,
            { duration: 2000 },
          );
        }
      });
  }
}
