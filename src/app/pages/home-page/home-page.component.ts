import {
  ChangeDetectionStrategy,
  Component,
  HostBinding
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { SwitchComponent } from 'src/app/components/switch/switch.component';
import { Layer } from 'src/app/models/device-layout.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

function getHighlightPositionCodes() {
  const randomIndex = Math.floor(Math.random() * 4);
  const string = 'Chara';
  const char1 = string[randomIndex];
  const char2 = string[randomIndex + 1];
  const relativePositionCodeMap = {
    C: [2, 3, 4],
    h: [0, 3],
    a: [0, 1, 2],
    r: [2, 3],
  };
  return [
    ...relativePositionCodeMap[char1 as keyof typeof relativePositionCodeMap],
    ...relativePositionCodeMap[
      char2 as keyof typeof relativePositionCodeMap
    ].map((code) => code + 5),
  ];
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    MatButton,
    MatIcon,
    SwitchComponent,
    IconGuardPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  highlightPositionCodes: number[] = getHighlightPositionCodes();

  @HostBinding('class') classes = 'block relative h-full';
  readonly Layer = Layer;
}
