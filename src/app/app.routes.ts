import { Route } from '@angular/router';
import { AccumulationPageComponent } from './pages/accumulation-page/accumulation-page.component';
import { AdaptationPageComponent } from './pages/adaptation-page/adaptation-page.component';
import { ChordsPageComponent } from './pages/chords-page/chords-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { InformationPageComponent } from './pages/information-page/information-page.component';
import { LlmPageComponent } from './pages/llm-page/llm-page.component';
import { RealizationPageComponent } from './pages/realization-page/realization-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

export const APP_ROUTES: Route[] = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  { path: 'information', component: InformationPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: 'llm', component: LlmPageComponent },
  { path: 'chords', component: ChordsPageComponent },
  { path: 'adaptation', component: AdaptationPageComponent },
  { path: 'realization', component: RealizationPageComponent },
  { path: 'accumulation', component: AccumulationPageComponent },
];
