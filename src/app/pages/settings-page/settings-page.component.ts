import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { OsKeyboardLayoutSettingPanelContentComponent } from 'src/app/components/os-keyboard-layout-setting-panel-content/os-keyboard-layout-setting-panel-content.component';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    MatAccordion,
    MatButtonToggleModule,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
    MatExpansionModule,
    OsKeyboardLayoutSettingPanelContentComponent,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private matDialog = inject(MatDialog);
  private matSnackBar = inject(MatSnackBar);
  private translateService = inject(TranslateService);

  @HostBinding('class') classes = 'block p-5';

  public languageSettingStore = inject(LanguageSettingStore);

  public supportedLanguages: LanguageInfo[] = [
    { id: UiLanguage.EN, name: 'English' },
    { id: UiLanguage.ZH_TW, name: '繁體中文' },
    { id: UiLanguage.JP, name: '日本語' },
  ];

  public setLanguage(languageId: LanguageInfo['id']) {
    this.languageSettingStore.set('uiLanguage', languageId);
    this.translateService.use(languageId);
  }
}

interface LanguageInfo {
  id: UiLanguage;
  name: string;
}
