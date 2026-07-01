import {
  AG_GRID_LOCALE_EN,
  AG_GRID_LOCALE_JP,
  AG_GRID_LOCALE_TW,
} from '@ag-grid-community/locale';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
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
import { FormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatChipOption, MatChipRemove } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import {
  MatFormField,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
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
  RowApiModule,
  RowSelectionModule,
  RowSelectionOptions,
  SelectionChangedEvent,
  TextFilterModule,
  themeQuartz,
} from 'ag-grid-community';
import { ChordActionButtonsRendererComponent } from 'src/app/components/chord-action-buttons-renderer/chord-action-buttons-renderer.component';
import { ChordKeyLabelsRendererComponent } from 'src/app/components/chord-key-labels-renderer/chord-key-labels-renderer.component';
import { CompoundAncestorsRendererComponent } from 'src/app/components/compound-ancestors-renderer/compound-ancestors-renderer.component';
import { CustomPracticeSettingDialogComponent } from 'src/app/components/custom-practice-setting-dialog/custom-practice-setting-dialog.component';
import { DynamicLibraryAncestorsRendererComponent } from 'src/app/components/dynamic-library-ancestors-renderer/dynamic-library-ancestors-renderer.component';
import { ChordSearchSetting } from 'src/app/models/chord-search-setting.models';
import { ChordDataWithLabelStateAndStatistic } from 'src/app/models/chord.models';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { QuickSettingService } from 'src/app/services/quick-setting.service';
import { ChordLabelStore } from 'src/app/stores/chord-label.store';
import { ChordSearchSettingStore } from 'src/app/stores/chord-search-setting.store';
import { ChordStore } from 'src/app/stores/chord.store';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import {
  Chord,
  ChordInNumberListForm,
  convertChordInNumberListFormToChord,
} from 'tangent-cc-lib';

ModuleRegistry.registerModules([
  TextFilterModule,
  NumberFilterModule,
  ExternalFilterModule,
  RowSelectionModule,
  LocaleModule,
  ClientSideRowModelModule,
  CellStyleModule,
  RowApiModule,
]);

const tableTheme = themeQuartz.withPart(colorSchemeDark);

@Component({
  selector: 'app-chords-page',
  templateUrl: 'chords-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    AgGridAngular,
    TranslatePipe,
    MatChipOption,
    MatChipRemove,
    MatIcon,
    IconGuardPipe,
    MatTooltip,
    MatIconButton,
    MatFormField,
    MatInput,
    MatPrefix,
    MatSuffix,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    MatSlideToggle,
    FormsModule,
  ],
  standalone: true,
})
export class ChordsPageComponent implements OnInit {
  @HostBinding('class') public hostClasses = ['flex', 'flex-col', 'h-full'];
  public tableTheme = tableTheme;
  public isDevMode = isDevMode();

  private readonly chordStore = inject(ChordStore);
  private readonly languageSettingStore = inject(LanguageSettingStore);
  private readonly chordDataService = inject(ChordDataService);
  private readonly translateService = inject(TranslateService);
  private readonly quickSettingService = inject(QuickSettingService);
  private readonly chordLabelStore = inject(ChordLabelStore);
  private readonly matDialog = inject(MatDialog);
  private readonly chordSearchSettingStore = inject(ChordSearchSettingStore);
  protected readonly chordSearchChordInputEnabled =
    this.chordSearchSettingStore.chordInput;
  protected readonly chordSearchChordOutputEnabled =
    this.chordSearchSettingStore.chordOutput;
  protected readonly chordSearchOnlyOneEnabled =
    this.chordSearchSettingStore.onlyOneEnabled;
  public isSearchSettingOpen = false;

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
  public readonly selectedChordNumber = computed(
    () => this.selectedIdList().length,
  );
  private readonly selectedChords = computed(() => {
    const chordDataList = this.chordDataListWithLabelStateAndStatistic();
    const selectedIdSet = new Set(this.selectedIdList());
    return chordDataList.filter((c) => selectedIdSet.has(c.id));
  });
  public readonly isAllSelectedChordsBookmarked = computed(() => {
    const selectedChords = this.selectedChords();
    return selectedChords.every((c) => c.bookmarked);
  });
  public readonly isAllSelectedChordsBlocked = computed(() => {
    const selectedChords = this.selectedChords();
    return selectedChords.every((c) => c.blocked);
  });

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
        ],
      },
      {
        headerName: this.translateService.instant(
          'chords-page.table-column.ancestors',
        ),
        children: [
          {
            field: 'compoundAncestors',
            headerName: this.translateService.instant(
              'chords-page.table-column.compound',
            ),
            cellRenderer: CompoundAncestorsRendererComponent,
          },
          {
            field: 'dynamicLibraryAncestors',
            headerName: this.translateService.instant(
              'chords-page.table-column.dynamic-library',
            ),
            cellRenderer: DynamicLibraryAncestorsRendererComponent,
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
      {
        headerName: this.translateService.instant(
          'chords-page.table-column.realization',
        ),
        children: [
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.chpm',
            ),
            field: 'realization.lastTenAverageChordPerMinute',
            width: 75,
            cellStyle: { textAlign: 'right' },
            cellClass: (
              param: CellClassParams<ChordDataWithLabelStateAndStatistic>,
            ) => (param.data?.realization?.passed ? 'bg-chara-500/20' : ''),
          },
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.count',
            ),
            field: 'realization.correctCount',
            width: 75,
            cellStyle: { textAlign: 'right' },
            cellClass: (
              param: CellClassParams<ChordDataWithLabelStateAndStatistic>,
            ) => (param.data?.realization?.passed ? 'bg-chara-500/20' : ''),
          },
        ],
      },
      {
        headerName: this.translateService.instant(
          'chords-page.table-column.accumulation',
        ),
        children: [
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.chpm',
            ),
            field: 'accumulation.lastTenAverageChordPerMinute',
            width: 75,
            cellStyle: { textAlign: 'right' },
          },
          {
            headerName: this.translateService.instant(
              'chords-page.table-column.count',
            ),
            field: 'accumulation.correctCount',
            width: 75,
            cellStyle: { textAlign: 'right' },
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

  public async loadDeviceLayoutAndChordsFromDevice() {
    this.quickSettingService.loadDeviceLayoutAndChordsFromDevice();
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
    patchState(this.chordStore, setEntities(chords));
  }

  public onSelectionChanged(event: SelectionChangedEvent) {
    const selectedNodes = event.api.getSelectedNodes();
    this.selectedIdList.set(
      (selectedNodes.map((n) => n.id).filter((v) => !!v) as string[]).map(
        (id: string) => +id,
      ),
    );
  }

  public clearSelectedState() {
    this.selectedIdList.set([]);
  }

  public setSelectedChordsBookmarkedState(nextBookmarked: boolean) {
    const selectedChords = this.selectedChords();
    if (nextBookmarked) {
      this.chordLabelStore.bookmarkChords(selectedChords);
    } else {
      this.chordLabelStore.unbookmarkChords(selectedChords);
    }
  }

  public setSelectedChordsBlockedState(nextBlocked: boolean) {
    const selectedChords = this.selectedChords();
    if (nextBlocked) {
      this.chordLabelStore.blockChords(selectedChords);
    } else {
      this.chordLabelStore.unblockChords(selectedChords);
    }
  }

  public openCustomPracticeSettingDialog() {
    this.matDialog.open(CustomPracticeSettingDialogComponent, {
      data: {
        chordHashList: this.selectedChords().map((c) => c.actionAndPhraseHash),
      },
    });
  }

  public onChordSearchSettingChange(
    key: keyof ChordSearchSetting,
    value: boolean,
  ) {
    this.chordSearchSettingStore.set(key, value);
  }
}
