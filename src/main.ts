import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideLoadingBarInterceptor } from '@ngx-loading-bar/http-client';
import { provideLoadingBarRouter } from '@ngx-loading-bar/router';
import {
  provideTranslateService,
  TranslateCompiler,
  TranslateService,
} from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { LlmService } from './app/services/llm.service';
import { LanguageSettingStore } from './app/stores/language-setting.store';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideLoadingBarInterceptor(),
    provideLoadingBarRouter(),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    provideAppInitializer(() => {
      const _languageSettingStore = inject(LanguageSettingStore);
      const _translateService = inject(TranslateService);
    }),
    provideAppInitializer(() => {
      const llmService = inject(LlmService);
      llmService.initEngine();
    }),
    { provide: TranslateCompiler, useClass: TranslateMessageFormatCompiler },
  ],
}).catch((err) => console.error(err));
