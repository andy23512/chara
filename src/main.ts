import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { LlmService } from './app/services/llm.service';
import { LanguageSettingStore } from './app/stores/language-setting.store';

export function initializeAppFactory() {
  const _languageSettingStore = inject(LanguageSettingStore);
  return () => {};
}

export function initializeLlmFactory() {
  const llmService = inject(LlmService);
  llmService.initEngine();
  return () => {};
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      deps: [TranslateService, LanguageSettingStore],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLlmFactory,
      multi: true,
      deps: [LlmService],
    },
  ],
}).catch((err) => console.error(err));
