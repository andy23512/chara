import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Page } from '../models/page.models';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { ChordDataService } from './chord-data.service';

@Injectable({ providedIn: 'root' })
export class PageLockService {
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly chordDataService = inject(ChordDataService);

  /**
   * The translation key of the message that explains why a page is locked, when
   * it differs from the page's usual lock message; otherwise null.
   */
  public getLockMessageOverride(page: Page): Signal<string | null> {
    if (page !== Page.Adaptation) {
      return signal(null);
    }
    return computed(() =>
      this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
      this.chordDataService.chordDataList().length > 0 &&
      this.chordDataService.nonBlockedChordCount() === 0
        ? 'nav.page.adaptation.all-blocked-lock-message'
        : null,
    );
  }

  public canAccessPage(page: Page): Signal<boolean> {
    switch (page) {
      case Page.Adaptation:
        return computed(() => {
          return (
            this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
            this.chordDataService.nonBlockedChordCount() > 0
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
        return computed(() => {
          return (
            this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
            this.chordDataService.realizationPhasePassedChordCount() > 0
          );
        });
      default:
        return signal(true);
    }
  }
}
