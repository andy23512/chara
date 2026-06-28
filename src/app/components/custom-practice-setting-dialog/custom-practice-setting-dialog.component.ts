import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { HintDisplayMode } from 'src/app/models/hint-display-mode.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { CustomPracticeSettingStore } from 'src/app/stores/custom-practice-setting.store';

@Component({
  selector: 'app-custom-practice-setting-dialog',
  templateUrl: 'custom-practice-setting-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    TranslatePipe,
    RealTitleCasePipe,
    FormsModule,
    MatRadioGroup,
    MatRadioButton,
  ],
})
export class CustomPracticeSettingDialogComponent {
  private customPracticeSettingStore = inject(CustomPracticeSettingStore);

  protected hintDisplayMode = this.customPracticeSettingStore.hintDisplayMode;
  protected hintDisplayModes: { name: string; value: HintDisplayMode }[] = [
    {
      name: 'custom-practice-setting-dialog.hint-display-mode.always',
      value: 'always',
    },
    {
      name: 'custom-practice-setting-dialog.hint-display-mode.timeout',
      value: 'timeout',
    },
  ];

  protected onHintDisplayModeChange(value: HintDisplayMode) {
    this.customPracticeSettingStore.set('hintDisplayMode', value);
  }
}
