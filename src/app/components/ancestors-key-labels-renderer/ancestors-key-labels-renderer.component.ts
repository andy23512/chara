import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ICellRendererAngularComp
} from 'ag-grid-angular';
import {
  ICellRendererParams
} from 'ag-grid-community';
import { ChordKeyLabel } from 'src/app/models/chord.models';
import { ChordKeyLabelComponent } from '../chord-key-label/chord-key-label.component';

@Component({
  selector: 'app-ancestors-key-labels-renderer',
  templateUrl: 'ancestors-key-labels-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ChordKeyLabelComponent],
})
export class AncestorsKeyLabelsRendererComponent
  implements ICellRendererAngularComp
{
  public ancestorsKeyLabels!: ChordKeyLabel[][];

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.ancestorsKeyLabels = params.value;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.ancestorsKeyLabels = params.value;
    return true;
  }
}
