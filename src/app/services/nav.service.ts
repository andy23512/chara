import { inject, Injectable, signal, Signal } from '@angular/core';
import { Page } from '../models/page.models';
import { ChordDataService } from './chord-data.service';

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly chordDataService = inject(ChordDataService);

  public getPageCount(page: Page): Signal<number> {
    switch (page) {
      case Page.Adaptation:
        return this.chordDataService.adaptationPhaseRemainedChordCount;
      case Page.Realization:
        return this.chordDataService.realizationPhaseRemainedChordCount;
      default:
        return signal(0);
    }
  }
}
