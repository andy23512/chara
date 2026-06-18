import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { Phase } from 'src/app/models/phase.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';

@Component({
  selector: 'app-adaptation-page-setting-panel-content',
  templateUrl: 'adaptation-page-setting-panel-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
  ],
})
export class AdaptationPageSettingPanelContentComponent {
  private readonly phaseSettingStore = inject(PhaseSettingStore);

  public adaptationPageSetting = this.phaseSettingStore.adaptation;

  public onPracticeSetSizeChange(value: number) {
    this.phaseSettingStore.set(Phase.Adaptation, 'practiceSetSize', value);
  }

  public onMinRepsToPassChange(value: number) {
    this.phaseSettingStore.set(Phase.Adaptation, 'minRepsToPass', value);
  }

  public onMinSpeedToPassChange(value: number) {
    this.phaseSettingStore.set(Phase.Adaptation, 'minSpeedToPass', value);
  }
}
