import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-information-page',
  standalone: true,
  imports: [],
  templateUrl: './information-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InformationPageComponent {
  @HostBinding('class') classes = 'block p-5';
}
