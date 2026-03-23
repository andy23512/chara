import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-chords-page',
  templateUrl: 'chords-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChordsPageComponent {}
