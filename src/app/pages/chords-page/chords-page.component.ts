import {
  AG_GRID_LOCALE_EN,
  AG_GRID_LOCALE_JP,
  AG_GRID_LOCALE_TW,
} from '@ag-grid-community/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostBinding,
  inject,
  isDevMode,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { patchState } from '@ngrx/signals';
import { setEntities } from '@ngrx/signals/entities';
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
import { ChordData } from 'src/app/models/chord.models';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { OperatingSystemService } from 'src/app/services/operating-system.service';
import { FlatChordTreeNodeStore } from 'src/app/stores/flat-chord-tree-node.store';
import { KeyboardLayoutSettingStore } from 'src/app/stores/keyboard-layout-setting.store';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import {
  convertFlattenedChordTreeNodesToChordData,
  flattenChordTreeNodes,
} from 'src/app/utils/chord.utils';
import {
  Chord,
  ChordInNumberListForm,
  convertChordInNumberListFormToChord,
  convertChordsToChordTreeNodes,
  SerialHandler,
  SerialPortHandler,
} from 'tangent-cc-lib';

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
  public flatChordTreeNodeStore = inject(FlatChordTreeNodeStore);
  public flatChordTreeNodes = this.flatChordTreeNodeStore.entities;
  public keyboardLayout = inject(KeyboardLayoutSettingStore).selectedEntity;
  public operatingSystem = inject(OperatingSystemService);
  public languageSettingStore = inject(LanguageSettingStore);
  public fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  public localeText = computed(() => {
    const uiLanguage = this.languageSettingStore.uiLanguage();
    switch (uiLanguage) {
      case UiLanguage.EN:
        return { ...AG_GRID_LOCALE_EN, noRowsToShow: 'No Chords To Show' };
      case UiLanguage.ZH_TW:
        return { ...AG_GRID_LOCALE_TW, noRowsToShow: '沒有和弦可顯示' };
      case UiLanguage.JP:
        return {
          ...AG_GRID_LOCALE_JP,
          noRowsToShow: '表示する和音がありません',
        };
      default:
        uiLanguage satisfies never;
        return {};
    }
  });

  public chordDataList = computed(() => {
    const keyboardLayout = this.keyboardLayout();
    const operatingSystem = this.operatingSystem.getOS();
    return convertFlattenedChordTreeNodesToChordData(
      this.flatChordTreeNodes(),
      keyboardLayout,
      operatingSystem,
    );
  });

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef<ChordData>[] = [
    {
      field: 'inputKeyLabels',
      headerName: 'Input',
      cellRenderer: ChordKeyLabelsRendererComponent,
    },
    {
      field: 'textOutput',
      headerName: 'Output (text)',
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
    const flatChordTreeNodes = flattenChordTreeNodes(chordTreeNodes);
    patchState(this.flatChordTreeNodeStore, setEntities(flatChordTreeNodes));
  }

  public openFileSelectionDialog() {
    this.fileInput().nativeElement.click();
  }

  public async onFileInputChange() {
    if (typeof FileReader === 'undefined') {
      return;
    }
    const fileInputElement = this.fileInput().nativeElement;
    if (
      fileInputElement.files === null ||
      fileInputElement.files.length === 0
    ) {
      return;
    }
    const file = fileInputElement.files[0];
    const text = await file.text();
    if (!text) {
      return;
    }
    const data = JSON.parse(text);
    if (!data?.chords) {
      return;
    }
    const chords: Chord[] = (data.chords as ChordInNumberListForm[]).map(
      convertChordInNumberListFormToChord,
    );
    const chordTreeNodes = convertChordsToChordTreeNodes(chords);
    const flatChordTreeNodes = flattenChordTreeNodes(chordTreeNodes);
    patchState(this.flatChordTreeNodeStore, setEntities(flatChordTreeNodes));
  }
}
