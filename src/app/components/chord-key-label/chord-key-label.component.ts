import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ChordKeyLabel, ChordKeyLabelType } from 'src/app/models/chord.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { KeyLabelType } from 'tangent-cc-lib';

@Component({
  selector: 'app-chord-key-label',
  templateUrl: 'chord-key-label.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [JsonPipe, IconGuardPipe, MatIcon],
})
export class ChordKeyLabelComponent {
  public chordKeyLabel = input.required<ChordKeyLabel>();
  public ChordKeyLabelType = ChordKeyLabelType;
  public KeyLabelType = KeyLabelType;
}
