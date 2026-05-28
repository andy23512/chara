import { computed, inject, Injectable } from '@angular/core';
import { ChordLabelStore } from '../stores/chord-label.store';
import { FlatChordTreeNodeStore } from '../stores/flat-chord-tree-node.store';
import { KeyboardLayoutSettingStore } from '../stores/keyboard-layout-setting.store';
import {
  appendLabelStateToChordData,
  convertFlattenedChordTreeNodesToChordData,
} from '../utils/chord.utils';
import { OperatingSystemService } from './operating-system.service';

@Injectable({ providedIn: 'root' })
export class ChordDataService {
  private readonly keyboardLayout = inject(KeyboardLayoutSettingStore)
    .selectedEntity;
  private readonly operatingSystem = inject(OperatingSystemService);
  private readonly flatChordTreeNodes = inject(FlatChordTreeNodeStore).entities;
  private readonly chordLabelStore = inject(ChordLabelStore);

  public readonly chordDataList = computed(() => {
    const keyboardLayout = this.keyboardLayout();
    const operatingSystem = this.operatingSystem.getOS();
    return convertFlattenedChordTreeNodesToChordData(
      this.flatChordTreeNodes(),
      keyboardLayout,
      operatingSystem,
    );
  });

  public chordDataListWithLabelState = computed(() => {
    const bookmarkedHashSet = this.chordLabelStore.bookmarkedHashSet();
    const blockedHashSet = this.chordLabelStore.blockedHashSet();
    return this.chordDataList().map((c) =>
      appendLabelStateToChordData(c, bookmarkedHashSet, blockedHashSet),
    );
  });
}
