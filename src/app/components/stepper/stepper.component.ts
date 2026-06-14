import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-stepper',
  templateUrl: 'stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    class: 'flex items-center gap-2 p-2 rounded-2xl bg-chara-500/20',
  },
})
export class StepperComponent {
  public totalSteps = input.required<number>();
  public stepIndex = input.required<number>();
  public steps = computed(() =>
    Array.from({ length: this.totalSteps() }, (_, i) => i),
  );
}
