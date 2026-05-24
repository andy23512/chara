import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ChordKeyLabel } from 'src/app/models/chord.models';
import { ChordKeyLabelComponent } from '../chord-key-label/chord-key-label.component';

@Component({
  selector: 'app-chord-key-labels-renderer',
  templateUrl: 'chord-key-labels-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ChordKeyLabelComponent],
})
export class ChordKeyLabelsRendererComponent
  implements ICellRendererAngularComp
{
  public chordKeyLabels!: ChordKeyLabel[];

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.chordKeyLabels = params.value;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.chordKeyLabels = params.value;
    return true;
  }
}
