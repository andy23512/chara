import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellEditorRendererAngularComp } from 'ag-grid-angular';
import { ICellEditorRendererParams } from 'ag-grid-community';
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
  implements ICellEditorRendererAngularComp
{
  public ancestorsKeyLabels!: ChordKeyLabel[][];

  agInit(params: ICellEditorRendererParams<any, any, any>): void {
    this.ancestorsKeyLabels = params.value;
  }
}
