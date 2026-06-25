import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

@Component({
  selector: 'app-information-page',
  standalone: true,
  imports: [
    TranslatePipe,
    RealTitleCasePipe,
    RouterLink,
    MatIcon,
    IconGuardPipe,
  ],
  templateUrl: './information-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block p-5',
  },
})
export class InformationPageComponent {}
