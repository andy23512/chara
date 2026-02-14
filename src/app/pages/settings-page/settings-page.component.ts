import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { QuickSettingPanelContentComponent } from 'src/app/components/quick-setting-panel-content/quick-setting-panel-content.component';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { ChordStore } from 'src/app/stores/chord.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import { LayoutHighlightSettingPanelContentComponent } from '../../components/layout-highlight-setting-panel-content/layout-highlight-setting-panel-content.component';
import { MiscSettingPanelContentComponent } from '../../components/misc-setting-panel-content/misc-setting-panel-content.component';
import { VisibilitySettingPanelContentComponent } from '../../components/visibility-setting-panel-content/visibility-setting-panel-content.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    MatAccordion,
    MatButton,
    MatIcon,
    VisibilitySettingPanelContentComponent,
    LayoutHighlightSettingPanelContentComponent,
    IconGuardPipe,
    MiscSettingPanelContentComponent,
    QuickSettingPanelContentComponent,
    MatButtonToggleModule,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
    MatExpansionModule,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private matDialog = inject(MatDialog);
  private matSnackBar = inject(MatSnackBar);
  private chordStore = inject(ChordStore);
  private deviceLayoutStore = inject(DeviceLayoutStore);
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
