import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { HotkeysShortcutPipe } from '@ngneat/hotkeys';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

export const HOTKEY_GROUPS = [
  {
    name: 'hotkey.practice-phase-pages.name',
    hotkeys: [
      {
        key: 'space',
        description: 'hotkey.practice-phase-pages.start-or-resume-the-practice',
      },
      {
        key: 'escape',
        description: 'hotkey.practice-phase-pages.pause-the-practice',
      },
    ],
  },
];

@Component({
  selector: 'app-hotkey-dialog',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    HotkeysShortcutPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './hotkey-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotkeyDialogComponent {
  hotkeyGroups = HOTKEY_GROUPS;
  keyAlias = { escape: 'esc', space: 'space' };
}
