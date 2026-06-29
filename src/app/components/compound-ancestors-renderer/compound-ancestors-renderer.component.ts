import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ChordData } from 'src/app/models/chord.models';
import { ChordKeyLabelComponent } from '../chord-key-label/chord-key-label.component';

@Component({
  selector: 'app-compound-ancestors-renderer',
  templateUrl: 'compound-ancestors-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ChordKeyLabelComponent],
})
export class CompoundAncestorsRendererComponent implements ICellRendererAngularComp {
  public ancestors!: ChordData['ancestors'];

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.ancestors = params.value;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.ancestors = params.value;
    return true;
  }
}
