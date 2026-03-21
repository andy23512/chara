import { Route } from '@angular/router';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { InformationPageComponent } from './pages/information-page/information-page.component';
import { LlmPageComponent } from './pages/llm-page/llm-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

export const APP_ROUTES: Route[] = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  { path: 'information', component: InformationPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: 'llm', component: LlmPageComponent },
  { path: 'chords', component: HomePageComponent },
  { path: 'adapt', component: HomePageComponent },
  { path: 'realize', component: HomePageComponent },
  { path: 'accum', component: HomePageComponent },
];
