import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { patchState } from '@ngrx/signals';
import { setEntities } from '@ngrx/signals/entities';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, tap, throttleTime } from 'rxjs';
import { convertChordsToChordTreeNodes, SerialHandler } from 'tangent-cc-lib';
import {
  ProgressSnackBarComponent,
  ProgressSnackBarData,
  ProgressSnackBarStepInfo,
} from '../components/progress-snack-bar/progress-snack-bar.component';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { FlatChordTreeNodeStore } from '../stores/flat-chord-tree-node.store';
import { flattenChordTreeNodes } from '../utils/chord.utils';
import { SerialPortHandlerService } from './serial-port-handler.service';

@Injectable({ providedIn: 'root' })
export class SerialHandlerService extends SerialHandler {
  private readonly matSnackBar = inject(MatSnackBar);
  private readonly translateService = inject(TranslateService);
  private readonly flatChordTreeNodeStore = inject(FlatChordTreeNodeStore);
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);

  constructor(protected serialPortHandlerService: SerialPortHandlerService) {
    super(serialPortHandlerService);
  }

  public async loadProfileLayoutMapWithProgressSnackBar(
    stepInfo?: ProgressSnackBarStepInfo,
  ) {
    const snackBarRef = this.matSnackBar.openFromComponent<
      ProgressSnackBarComponent,
      ProgressSnackBarData
    >(ProgressSnackBarComponent, {
      data: {
        message: this.translateService.instant(
          'general.device-layout-loading-message',
        ),
        progress: 0,
        stepInfo,
      },
    });
    return lastValueFrom(
      this.loadProfileLayoutMap().pipe(
        throttleTime(300, undefined, { trailing: true }),
        tap(async (r) => {
          if (r.complete) {
            snackBarRef.dismiss();
            const profileLayoutMap = r.profileLayoutMap;
            if (!profileLayoutMap) {
              return;
            }
            this.deviceLayoutStore.setProfileLayoutMap(profileLayoutMap);
            if (!stepInfo) {
              this.matSnackBar.open(
                this.translateService.instant(
                  'general.device-layout-loaded-message',
                ),
                undefined,
                { duration: 3000 },
              );
            }
          } else {
            snackBarRef.instance.updateProgress((r.loaded / r.total) * 100);
          }
        }),
      ),
    );
  }

  public async loadChordsWithProgressSnackBar(
    stepInfo?: ProgressSnackBarStepInfo,
  ) {
    const snackBarRef = this.matSnackBar.openFromComponent<
      ProgressSnackBarComponent,
      ProgressSnackBarData
    >(ProgressSnackBarComponent, {
      data: {
        message: this.translateService.instant(
          'general.chords-loading-message',
        ),
        progress: 0,
        stepInfo,
      },
    });
    return lastValueFrom(
      this.loadChords().pipe(
        throttleTime(300, undefined, { trailing: true }),
        tap(async (r) => {
          if (r.complete) {
            snackBarRef.dismiss();
            const chords = r.chords;
            if (!chords) {
              return;
            }
            const chordTreeNodes = convertChordsToChordTreeNodes(chords);
            const flatChordTreeNodes = flattenChordTreeNodes(chordTreeNodes);
            patchState(
              this.flatChordTreeNodeStore,
              setEntities(flatChordTreeNodes),
            );
            if (!stepInfo) {
              this.matSnackBar.open(
                this.translateService.instant('general.chords-loaded-message'),
                undefined,
                { duration: 3000 },
              );
            }
          } else {
            snackBarRef.instance.updateProgress((r.loaded / r.total) * 100);
          }
        }),
      ),
    );
  }
}
