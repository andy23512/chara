import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { KeyboardLayoutSettingStore } from 'src/app/stores/keyboard-layout-setting.store';

@Component({
  selector: 'app-os-keyboard-layout-setting-panel-content',
  templateUrl: 'os-keyboard-layout-setting-panel-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    MatTooltip,
    NgxMatSelectSearchModule,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
    IconGuardPipe,
    MatIcon,
    MatSuffix,
    MatIconButton,
  ],
})
export class OsKeyboardLayoutSettingPanelContentComponent {
  readonly keyboardLayoutStore = inject(KeyboardLayoutSettingStore);

  readonly selectedKeyboardLayoutId = this.keyboardLayoutStore.selectedId;
  readonly keyboardLayout = this.keyboardLayoutStore.selectedEntity;
  readonly keyboardLayouts = this.keyboardLayoutStore.entities;

  readonly keyboardLayoutSearchQuery = signal('');

  readonly filteredKeyboardLayouts = computed(() => {
    const keyboardLayouts = this.keyboardLayouts();
    const keyboardLayoutSearchQuery =
      this.keyboardLayoutSearchQuery().toLowerCase();
    if (!keyboardLayoutSearchQuery) {
      return keyboardLayouts;
    }
    return keyboardLayouts.filter((k) =>
      k.name.toLowerCase().includes(keyboardLayoutSearchQuery),
    );
  });

  public setSelectedKeyboardLayoutId(keyboardLayoutId: string) {
    this.keyboardLayoutStore.setSelectedId(keyboardLayoutId);
  }

  public onOpenReferenceButtonClick(event: MouseEvent) {
    event.stopPropagation();
  }

  public onResetButtonClick(event: MouseEvent) {
    event.stopPropagation();
    this.setSelectedKeyboardLayoutId('us');
  }
}
