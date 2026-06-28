import { Route } from '@angular/router';
import { pageLockGuard } from './guards/page-lock.guard';
import { Page } from './models/page.models';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full' as const,
    data: { page: Page.Home },
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'information',
    data: { page: Page.Information },
    loadComponent: () =>
      import('./pages/information-page/information-page.component').then(
        (m) => m.InformationPageComponent,
      ),
  },
  {
    path: 'settings',
    data: { page: Page.Settings },
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'chords',
    data: { page: Page.Chords },
    loadComponent: () =>
      import('./pages/chords-page/chords-page.component').then(
        (m) => m.ChordsPageComponent,
      ),
  },
  {
    path: 'adaptation',
    data: { page: Page.Adaptation },
    loadComponent: () =>
      import('./pages/adaptation-page/adaptation-page.component').then(
        (m) => m.AdaptationPageComponent,
      ),
  },
  {
    path: 'realization',
    data: { page: Page.Realization },
    loadComponent: () =>
      import('./pages/realization-page/realization-page.component').then(
        (m) => m.RealizationPageComponent,
      ),
  },
  {
    path: 'accumulation',
    data: { page: Page.Accumulation },
    loadComponent: () =>
      import('./pages/accumulation-page/accumulation-page.component').then(
        (m) => m.AccumulationPageComponent,
      ),
  },
  {
    path: 'custom-practice',
    loadComponent: () =>
      import(
        './pages/custom-practice-page/custom-practice-page.component'
      ).then((m) => m.CustomPracticePageComponent),
  },
].map((r) => ({ ...r, canActivate: [pageLockGuard] }));
