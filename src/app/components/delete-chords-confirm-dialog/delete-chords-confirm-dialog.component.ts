import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { SentenceCasePipe } from 'src/app/pipes/sentence-case.pipe';

@Component({
  selector: 'app-delete-chords-confirm-dialog',
  templateUrl: 'delete-chords-confirm-dialog.component.html',
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
export class DeleteChordsConfirmDialogComponent {}
