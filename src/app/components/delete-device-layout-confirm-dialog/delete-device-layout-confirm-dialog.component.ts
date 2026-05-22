import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { SentenceCasePipe } from 'src/app/pipes/sentence-case.pipe';

@Component({
  selector: 'app-delete-device-layout-confirm-dialog',
  templateUrl: 'delete-device-layout-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    TranslatePipe,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    SentenceCasePipe,
  ],
})
export class DeleteDeviceLayoutConfirmDialogComponent {}
