import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { SinglePhaseSetting } from 'src/app/models/phase-setting.models';
import { Phase } from 'src/app/models/phase.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';

@Component({
  selector: 'app-phase-setting-panel-content',
  templateUrl: 'phase-setting-panel-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
    MatTooltip,
  ],
})
export class PhaseSettingPanelContentComponent {
  protected readonly phaseSettingStore = inject(PhaseSettingStore);

  protected phases: {
    name: string;
    value: Phase.Adaptation | Phase.Realization;
  }[] = [
    {
      name: 'phase-setting.adaptation',
      value: Phase.Adaptation,
    },
    {
      name: 'phase-setting.realization',
      value: Phase.Realization,
    },
  ];
  protected settings: {
    name: string;
    hint: string;
    key: keyof SinglePhaseSetting;
  }[] = [
    {
      name: 'phase-setting.practice-set-size.label',
      hint: 'phase-setting.practice-set-size.hint',
      key: 'practiceSetSize',
    },
    {
      name: 'phase-setting.min-reps-to-pass.label',
      hint: 'phase-setting.min-reps-to-pass.hint',
      key: 'minRepsToPass',
    },
    {
      name: 'phase-setting.min-speed-to-pass.label',
      hint: 'phase-setting.min-speed-to-pass.hint',
      key: 'minSpeedToPass',
    },
  ];

  public onSettingValueChange(
    phase: Phase.Adaptation | Phase.Realization,
    key: keyof SinglePhaseSetting,
    value: number,
  ) {
    this.phaseSettingStore.set(phase, key, value);
  }
}
