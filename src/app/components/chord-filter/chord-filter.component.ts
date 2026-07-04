import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  Signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { ChordDataService } from 'src/app/services/chord-data.service';
import { ChordFilterStore } from 'src/app/stores/chord-filter.store';

@Component({
  selector: 'app-chord-filter',
  templateUrl: 'chord-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatIcon,
    IconGuardPipe,
    MatTooltip,
    TranslatePipe,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    MatSelect,
    MatOption,
  ],
})
export class ChordFilterComponent implements OnInit {
  private readonly chordFilterStore = inject(ChordFilterStore);
  private readonly translateService = inject(TranslateService);
  private readonly chordDataService = inject(ChordDataService);
  protected isFilterOpen = false;
  protected bookmarkFilter = this.chordFilterStore.bookmarkFilter;
  protected blockFilter = this.chordFilterStore.blockFilter;
  protected hasActiveSelectionFilters =
    this.chordFilterStore.hasActiveSelectionFilters;
  protected bookmarkFilterOptions: { value: string; label: string }[] = [];
  protected blockFilterOptions: { value: string; label: string }[] = [];
  protected dynamicLibraryFilter = this.chordFilterStore.dynamicLibraryFilter;
  protected dynamicLibraryFilterOptions: Signal<
    { value: string; label: string }[]
  > = computed(() => {
    const dynamicLibraries = this.chordDataService.dynamicLibraries();
    return [
      {
        value: 'all',
        label: this.translateService.instant(
          'chord-filter.dynamic-library-filter.all',
        ),
      },
      {
        value: 'base',
        label: this.translateService.instant(
          'chord-filter.dynamic-library-filter.base',
        ),
      },
      ...dynamicLibraries.map((c) => ({
        value: c.actionAndPhraseHash,
        label: [
          ...c.dynamicLibraryAncestors.map((a) => a.textOutput),
          c.textOutput,
        ].join(' > '),
      })),
    ];
  });

  public ngOnInit(): void {
    this.bookmarkFilterOptions = [
      {
        value: 'all',
        label: this.translateService.instant(
          'chord-filter.bookmark-filter.all',
        ),
      },
      {
        value: 'bookmarked',
        label: this.translateService.instant(
          'chord-filter.bookmark-filter.bookmarked',
        ),
      },
      {
        value: 'unbookmarked',
        label: this.translateService.instant(
          'chord-filter.bookmark-filter.unbookmarked',
        ),
      },
    ];
    this.blockFilterOptions = [
      {
        value: 'all',
        label: this.translateService.instant('chord-filter.block-filter.all'),
      },
      {
        value: 'blocked',
        label: this.translateService.instant(
          'chord-filter.block-filter.blocked',
        ),
      },
      {
        value: 'unblocked',
        label: this.translateService.instant(
          'chord-filter.block-filter.unblocked',
        ),
      },
    ];
  }

  protected setBookmarkFilter(
    value: 'all' | 'bookmarked' | 'unbookmarked',
  ): void {
    this.chordFilterStore.setBookmarkFilter(value);
  }

  protected setBlockFilter(value: 'all' | 'blocked' | 'unblocked'): void {
    this.chordFilterStore.setBlockFilter(value);
  }

  protected setDynamicLibraryFilter(value: string): void {
    this.chordFilterStore.setDynamicLibraryFilter(value);
  }
}
