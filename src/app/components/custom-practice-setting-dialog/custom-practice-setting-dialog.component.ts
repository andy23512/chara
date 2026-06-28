import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { HintDisplayMode } from 'src/app/models/hint-display-mode.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { CustomPracticeSettingStore } from 'src/app/stores/custom-practice-setting.store';

interface CustomPracticeSettingDialogData {
  chordHashList: string[];
}

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
  private readonly customPracticeSettingStore = inject(
    CustomPracticeSettingStore,
  );
  private readonly matDialogRef = inject(MatDialogRef);
  private readonly router = inject(Router);
  private readonly data: CustomPracticeSettingDialogData =
    inject(MAT_DIALOG_DATA);

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

  protected onEnterButtonClick() {
    this.matDialogRef.close();
    this.router.navigate(['custom-practice'], {
      queryParams: {
        chordHashListJson: JSON.stringify(this.data.chordHashList),
        hintDisplayMode: this.hintDisplayMode(),
      },
    });
  }
}
