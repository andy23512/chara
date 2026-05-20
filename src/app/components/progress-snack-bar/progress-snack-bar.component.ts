import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { TranslatePipe } from '@ngx-translate/core';

export interface ProgressSnackBarStepInfo {
  step: number;
  total: number;
}

export interface ProgressSnackBarData {
  message: string;
  progress: number;
  stepInfo?: ProgressSnackBarStepInfo;
}

@Component({
  selector: 'app-progress-snack-bar',
  templateUrl: 'progress-snack-bar.component.html',
  styleUrl: 'progress-snack-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatProgressBar, TranslatePipe],
})
export class ProgressSnackBarComponent {
  public data: ProgressSnackBarData = inject(MAT_SNACK_BAR_DATA);
  public cdr = inject(ChangeDetectorRef);

  public updateProgress(progress: number) {
    this.data.progress = progress;
    this.cdr.markForCheck();
  }
}
