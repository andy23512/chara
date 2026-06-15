import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AncestorData } from 'src/app/models/chord.models';

@Component({
  selector: 'app-dynamic-library-ancestors-chip',
  templateUrl: 'dynamic-library-ancestors-chip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    class: 'px-2 h-6 rounded-2xl bg-gray-200 text-gray-900',
  },
})
export class DynamicLibraryAncestorsChipComponent {
  public dynamicLibraryAncestors = input.required<AncestorData[]>();
}
