import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hotkey-dialog',
  standalone: true,
  imports: [],
  templateUrl: './hotkey-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotkeyDialogComponent {}
