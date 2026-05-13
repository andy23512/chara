import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'information',
    loadComponent: () =>
      import('./pages/information-page/information-page.component').then(
        (m) => m.InformationPageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'llm',
    loadComponent: () =>
      import('./pages/llm-page/llm-page.component').then(
        (m) => m.LlmPageComponent,
      ),
  },
  {
    path: 'chords',
    loadComponent: () =>
      import('./pages/chords-page/chords-page.component').then(
        (m) => m.ChordsPageComponent,
      ),
  },
  {
    path: 'adaptation',
    loadComponent: () =>
      import('./pages/adaptation-page/adaptation-page.component').then(
        (m) => m.AdaptationPageComponent,
      ),
  },
  {
    path: 'realization',
    loadComponent: () =>
      import('./pages/realization-page/realization-page.component').then(
        (m) => m.RealizationPageComponent,
      ),
  },
  {
    path: 'accumulation',
    loadComponent: () =>
      import('./pages/accumulation-page/accumulation-page.component').then(
        (m) => m.AccumulationPageComponent,
      ),
  },
];
