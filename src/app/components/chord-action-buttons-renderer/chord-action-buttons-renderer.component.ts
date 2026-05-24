import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ChordDataWithLabelState } from 'src/app/models/chord.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { ChordLabelStore } from 'src/app/stores/chord-label.store';

@Component({
  selector: 'app-chord-action-buttons-renderer',
  templateUrl: 'chord-action-buttons-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatIcon, IconGuardPipe],
})
export class ChordActionButtonsRendererComponent
  implements ICellRendererAngularComp
{
  private readonly chordLabelStore = inject(ChordLabelStore);

  public chord!: ChordDataWithLabelState;

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.chord = params.node.data;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.chord = params.node.data;
    return true;
  }

  public toggleBookmarkedState(chord: ChordDataWithLabelState) {
    if (chord.bookmarked) {
      this.chordLabelStore.unbookmarkChord(chord);
    } else {
      this.chordLabelStore.bookmarkChord(chord);
    }
  }

  public toggleBlockedState(chord: ChordDataWithLabelState) {
    if (chord.blocked) {
      this.chordLabelStore.unblockChord(chord);
    } else {
      this.chordLabelStore.blockChord(chord);
    }
  }
}
