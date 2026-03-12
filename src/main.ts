import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxWebLlmModule } from 'ngx-web-llm';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';
import { LanguageSettingStore } from './app/stores/language-setting.store';

export function initializeAppFactory() {
  const _languageSettingStore = inject(LanguageSettingStore);
  return () => {};
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(
      NgxWebLlmModule.forRoot({
        defaultModelId: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
        preload: true,
      }),
    ),
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
  ],
}).catch((err) => console.error(err));
