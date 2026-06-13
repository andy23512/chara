import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { AdaptationPageSettingStore } from 'src/app/stores/adaptation-page-setting.store';

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
  private readonly adaptationPageSettingStore = inject(
    AdaptationPageSettingStore,
  );

  public practiceSetSize = this.adaptationPageSettingStore.practiceSetSize;
  public minRepsToPass = this.adaptationPageSettingStore.minRepsToPass;
  public minSpeedToPass = this.adaptationPageSettingStore.minSpeedToPass;

  public onPracticeSetSizeChange(value: number) {
    this.adaptationPageSettingStore.set('practiceSetSize', value);
  }

  public onMinRepsToPassChange(value: number) {
    this.adaptationPageSettingStore.set('minRepsToPass', value);
  }

  public onMinSpeedToPassChange(value: number) {
    this.adaptationPageSettingStore.set('minSpeedToPass', value);
  }
}
