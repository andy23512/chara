import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatFormField,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslatePipe } from '@ngx-translate/core';
import { ChordSearchSetting } from 'src/app/models/chord-search-setting.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { ChordFilterStore } from 'src/app/stores/chord-filter.store';
import { ChordSearchSettingStore } from 'src/app/stores/chord-search-setting.store';

@Component({
  selector: 'app-chord-search',
  templateUrl: 'chord-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    IconGuardPipe,
    MatIcon,
    MatInput,
    MatSlideToggle,
    FormsModule,
    TranslatePipe,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    MatPrefix,
    MatSuffix,
  ],
})
export class ChordSearchComponent {
  private readonly chordFilterStore = inject(ChordFilterStore);
  private readonly chordSearchSettingStore = inject(ChordSearchSettingStore);

  protected readonly searchQuery = this.chordFilterStore.searchQuery;
  protected readonly chordSearchChordInputEnabled =
    this.chordSearchSettingStore.chordInput;
  protected readonly chordSearchChordOutputEnabled =
    this.chordSearchSettingStore.chordOutput;
  protected readonly chordSearchOnlyOneEnabled =
    this.chordSearchSettingStore.onlyOneEnabled;
  protected isSearchSettingOpen = false;

  protected setSearchQuery(searchQuery: string) {
    this.chordFilterStore.setSearchQuery(searchQuery);
  }

  public onChordSearchSettingChange(
    key: keyof ChordSearchSetting,
    value: boolean,
  ) {
    this.chordSearchSettingStore.set(key, value);
  }
}
