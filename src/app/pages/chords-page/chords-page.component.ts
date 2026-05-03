import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  isDevMode,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ClientSideRowModelModule,
  ColDef,
  colorSchemeDark,
  ExternalFilterModule,
  LocaleModule,
  ModuleRegistry,
  NumberFilterModule,
  RowSelectionModule,
  TextFilterModule,
  themeQuartz,
} from 'ag-grid-community';
import { lastValueFrom } from 'rxjs';
import { flattenChordTreeNodes } from 'src/app/utils/chord.utils';
import {
  ChordTreeNode,
  convertChordsToChordTreeNodes,
  SerialHandler,
  SerialPortHandler,
} from 'tangent-cc-lib';
import { MOCK_CHORD_TREE_NODES } from '../../mock/mock-chords';

ModuleRegistry.registerModules([
  TextFilterModule,
  NumberFilterModule,
  ExternalFilterModule,
  RowSelectionModule,
  LocaleModule,
  ClientSideRowModelModule,
]);

const tableTheme = themeQuartz.withPart(colorSchemeDark);

@Component({
  selector: 'app-chords-page',
  templateUrl: 'chords-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, AgGridAngular],
  standalone: true,
})
export class ChordsPageComponent {
  @HostBinding('class') public hostClasses = ['flex', 'flex-col', 'h-full'];
  public tableTheme = tableTheme;
  public isDevMode = isDevMode();
  public flattenedChordTreeNodesSignal = signal<ChordTreeNode[]>(
    isDevMode() ? flattenChordTreeNodes(MOCK_CHORD_TREE_NODES) : [],
  );

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef<ChordTreeNode>[] = [
    { field: 'input' },
    { field: 'output' },
    { field: 'ancestors' },
  ];

  public async loadChordsFromDevice() {
    const serialPortHandler = new SerialPortHandler();
    const serialHandler = new SerialHandler(serialPortHandler);
    await serialHandler.connect();
    const { chords } = await lastValueFrom(serialHandler.loadChords());
    await serialHandler.disconnect();
    if (!chords) {
      return;
    }
    const chordTreeNodes = convertChordsToChordTreeNodes(chords);
    const flattenedChordTreeNodes = flattenChordTreeNodes(chordTreeNodes);
    this.flattenedChordTreeNodesSignal.set(flattenedChordTreeNodes);
  }
}
