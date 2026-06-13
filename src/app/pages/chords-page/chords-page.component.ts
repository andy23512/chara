import {
  AG_GRID_LOCALE_EN,
  AG_GRID_LOCALE_JP,
  AG_GRID_LOCALE_TW,
} from '@ag-grid-community/locale';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostBinding,
  inject,
  isDevMode,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { patchState } from '@ngrx/signals';
import { setEntities } from '@ngrx/signals/entities';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClassParams,
  CellStyleModule,
  ClientSideRowModelModule,
  ColDef,
  ColGroupDef,
  colorSchemeDark,
  ExternalFilterModule,
  GetRowIdFunc,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  LocaleModule,
  ModuleRegistry,
  NumberFilterModule,
  RowSelectionModule,
  RowSelectionOptions,
  SelectionChangedEvent,
  TextFilterModule,
  themeQuartz,
} from 'ag-grid-community';
import { AncestorsKeyLabelsRendererComponent } from 'src/app/components/ancestors-key-labels-renderer/ancestors-key-labels-renderer.component';
import { ChordActionButtonsRendererComponent } from 'src/app/components/chord-action-buttons-renderer/chord-action-buttons-renderer.component';
import { ChordKeyLabelsRendererComponent } from 'src/app/components/chord-key-labels-renderer/chord-key-labels-renderer.component';
import { ChordDataWithLabelStateAndStatistic } from 'src/app/models/chord.models';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { SerialHandlerService } from 'src/app/services/serial-handler.service';
import { FlatChordTreeNodeStore } from 'src/app/stores/flat-chord-tree-node.store';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import { flattenChordTreeNodes } from 'src/app/utils/chord.utils';
import {
  Chord,
  ChordInNumberListForm,
  convertChordInNumberListFormToChord,
  convertChordsToChordTreeNodes,
} from 'tangent-cc-lib';

ModuleRegistry.registerModules([
  TextFilterModule,
  NumberFilterModule,
  ExternalFilterModule,
  RowSelectionModule,
  LocaleModule,
  ClientSideRowModelModule,
  CellStyleModule,
]);

const tableTheme = themeQuartz.withPart(colorSchemeDark);

@Component({
  selector: 'app-chords-page',
  templateUrl: 'chords-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, AgGridAngular, TranslatePipe],
  standalone: true,
})
export class ChordsPageComponent implements OnInit {
  @HostBinding('class') public hostClasses = ['flex', 'flex-col', 'h-full'];
  public tableTheme = tableTheme;
  public isDevMode = isDevMode();

  private readonly flatChordTreeNodeStore = inject(FlatChordTreeNodeStore);
  private readonly languageSettingStore = inject(LanguageSettingStore);
  private readonly serialHandlerService = inject(SerialHandlerService);
  private readonly chordDataService = inject(ChordDataService);
  private readonly translateService = inject(TranslateService);

  private readonly fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private gridApi!: GridApi;

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

  private readonly chordDataList = this.chordDataService.chordDataList;
  public readonly chordDataListWithLabelStateAndStatistic =
    this.chordDataService.chordDataListWithLabelStateAndStatistic;

  private readonly selectedIdList = signal<number[]>([]);

  public colDefs: (
    | ColDef<ChordDataWithLabelStateAndStatistic>
    | ColGroupDef<ChordDataWithLabelStateAndStatistic>
  )[] = [];
  public readonly rowSelection: RowSelectionOptions = {
    mode: 'multiRow',
    headerCheckbox: false,
  };

  constructor() {
    effect(() => {
      const selectIdSet = new Set(this.selectedIdList());
      if (this.gridApi) {
        this.gridApi.forEachNode((node) => {
          if (!node.id) {
            return;
          }
          const isSelectedInTable = node.isSelected();
          const inSelectedIdSet = selectIdSet.has(+node.id);
          if (isSelectedInTable !== inSelectedIdSet) {
            node.setSelected(inSelectedIdSet);
          }
        });
      }
    });
    effect(() => {
      const _chordDataList = this.chordDataList();
      this.selectedIdList.set([]);
    });
  }

  public ngOnInit(): void {
    this.colDefs = [
      {
        width: 100,
        headerName: '',
        cellRenderer: ChordActionButtonsRendererComponent,
      },
      {
        headerName: this.translateService.instant(
          'chords-page.table-column.chord',
        ),
        children: [
          {
            field: 'inputKeyLabels',
            headerName: this.translateService.instant(
              'chords-page.table-column.input',
            ),
            cellRenderer: ChordKeyLabelsRendererComponent,
          },
          {
            field: 'textOutput',
            headerName: this.translateService.instant(
              'chords-page.table-column.output-text',
            ),
          },
          {
            field: 'outputKeyLabels',
            headerName: this.translateService.instant(
              'chords-page.table-column.output-keys',
            ),
            cellRenderer: ChordKeyLabelsRendererComponent,
          },
          {
            field: 'ancestorsKeyLabels',
            headerName: this.translateService.instant(
              'chords-page.table-column.ancestors',
            ),
            cellRenderer: AncestorsKeyLabelsRendererComponent,
          },
        ],
      },
      {
        headerName: this.translateService.instant(
          'chords-page.table-column.adaptation',
        ),
        children: [
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.chpm',
            ),
            field: 'adaptation.lastTenAverageChordPerMinute',
            width: 75,
            cellStyle: { textAlign: 'right' },
            cellClass: (
              param: CellClassParams<ChordDataWithLabelStateAndStatistic>,
            ) => (param.data?.adaptation?.passed ? 'bg-chara-500/20' : ''),
          },
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.count',
            ),
            field: 'adaptation.correctCount',
            width: 75,
            cellStyle: { textAlign: 'right' },
            cellClass: (
              param: CellClassParams<ChordDataWithLabelStateAndStatistic>,
            ) => (param.data?.adaptation?.passed ? 'bg-chara-500/20' : ''),
          },
        ],
      },
    ];
  }

  public getRowId: GetRowIdFunc = (params: GetRowIdParams) => {
    return params.data.id.toString();
  };

  public onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  public async loadChordsFromDevice() {
    await this.serialHandlerService.connect();
    await this.serialHandlerService.loadChordsWithProgressSnackBar();
    await this.serialHandlerService.disconnect();
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

  public onSelectionChanged(event: SelectionChangedEvent) {
    const selectedNodes = event.api.getSelectedNodes();
    this.selectedIdList.set(
      (selectedNodes.map((n) => n.id).filter((v) => !!v) as string[]).map(
        (id: string) => +id,
      ),
    );
  }
}
