import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ChordData } from 'src/app/models/chord.models';

@Component({
  selector: 'app-dynamic-library-ancestors-renderer',
  templateUrl: 'dynamic-library-ancestors-renderer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class DynamicLibraryAncestorsRendererComponent implements ICellRendererAngularComp {
  public ancestors!: ChordData['ancestors'];

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.ancestors = params.value;
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    this.ancestors = params.value;
    return true;
  }
}
