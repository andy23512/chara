import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Page } from '../models/page.models';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { FlatChordTreeNodeStore } from '../stores/flat-chord-tree-node.store';

@Injectable({ providedIn: 'root' })
export class PageLockService {
  private readonly deviceLayoutStore = inject(DeviceLayoutStore);
  private readonly flatChordTreeNodeStore = inject(FlatChordTreeNodeStore);

  public canAccessPage(page: Page): Signal<boolean> {
    switch (page) {
      case Page.Adaptation:
        return computed(() => {
          return (
            this.deviceLayoutStore.hasLoadedProfileLayoutMap() &&
            this.flatChordTreeNodeStore.entityCount() > 0
          );
        });
      case Page.Realization:
      case Page.Accumulation:
        return signal(false);
      default:
        return signal(true);
    }
  }
}
