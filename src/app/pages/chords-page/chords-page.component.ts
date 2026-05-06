import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostBinding,
  inject,
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
import { AncestorsKeyLabelsRendererComponent } from 'src/app/components/ancestors-key-labels-renderer/ancestors-key-labels-renderer.component';
import { ChordKeyLabelsRendererComponent } from 'src/app/components/chord-key-labels-renderer/chord-key-labels-renderer.component';
import { ChordDataWithKeyLabels } from 'src/app/models/chord.models';
import { OperatingSystemService } from 'src/app/services/operating-system.service';
import { KeyboardLayoutSettingStore } from 'src/app/stores/keyboard-layout-setting.store';
import {
  convertFlattenedChordTreeNodesToChordDataWithKeyLabels,
  flattenChordTreeNodes,
} from 'src/app/utils/chord.utils';
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
  imports: [
    MatButtonModule,
    AgGridAngular,
    ChordKeyLabelsRendererComponent,
    AncestorsKeyLabelsRendererComponent,
  ],
  standalone: true,
})
export class ChordsPageComponent {
  @HostBinding('class') public hostClasses = ['flex', 'flex-col', 'h-full'];
  public tableTheme = tableTheme;
  public isDevMode = isDevMode();
  public flattenedChordTreeNodesSignal = signal<ChordTreeNode[]>(
    isDevMode() ? flattenChordTreeNodes(MOCK_CHORD_TREE_NODES) : [],
  );
  public keyboardLayout = inject(KeyboardLayoutSettingStore).selectedEntity;
  public operatingSystem = inject(OperatingSystemService);

  public chordDataWithKeyLabelsList = computed(() => {
    const keyboardLayout = this.keyboardLayout();
    const operatingSystem = this.operatingSystem.getOS();
    return convertFlattenedChordTreeNodesToChordDataWithKeyLabels(
      this.flattenedChordTreeNodesSignal(),
      keyboardLayout,
      operatingSystem,
    );
  });

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef<ChordDataWithKeyLabels>[] = [
    {
      field: 'inputKeyLabels',
      headerName: 'Input',
      cellRenderer: ChordKeyLabelsRendererComponent,
    },
    {
      field: 'outputKeyLabels',
      headerName: 'Output (keys)',
      cellRenderer: ChordKeyLabelsRendererComponent,
    },
    {
      field: 'ancestorsKeyLabels',
      headerName: 'Ancestors',
      cellRenderer: AncestorsKeyLabelsRendererComponent,
    },
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
