import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Page } from '../models/page.models';
import { ChordStore } from '../stores/chord.store';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { ChordDataService } from './chord-data.service';

@Injectable({ providedIn: 'root' })
export class PageLockService {
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly chordStore = inject(ChordStore);
  private readonly chordDataService = inject(ChordDataService);

  public canAccessPage(page: Page): Signal<boolean> {
    switch (page) {
      case Page.Adaptation:
        return computed(() => {
          return (
            this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
            this.chordStore.entityCount() > 0
          );
        });
      case Page.Realization:
        return computed(() => {
          return (
            this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
            this.chordDataService.adaptationPhasePassedChordCount() > 0
          );
        });
      case Page.Accumulation:
      case Page.Information:
        return signal(false);
      default:
        return signal(true);
    }
  }
}
