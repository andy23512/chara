import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Page } from '../models/page.models';
import { ChordDataService } from './chord-data.service';
import { NavService } from './nav.service';

describe('NavService', () => {
  const adaptationRemaining = signal(7);
  const realizationRemaining = signal(3);
  let service: NavService;

  beforeEach(() => {
    adaptationRemaining.set(7);
    realizationRemaining.set(3);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ChordDataService,
          useValue: {
            adaptationPhaseRemainedChordCount: adaptationRemaining,
            realizationPhaseRemainedChordCount: realizationRemaining,
          },
        },
      ],
    });
    service = TestBed.inject(NavService);
  });

  it('shows the remaining adaptation chords on the adaptation page', () => {
    const count = service.getPageCount(Page.Adaptation);
    expect(count()).toBe(7);
    adaptationRemaining.set(6);
    expect(count()).toBe(6);
  });

  it('shows the remaining realization chords on the realization page', () => {
    const count = service.getPageCount(Page.Realization);
    expect(count()).toBe(3);
    realizationRemaining.set(0);
    expect(count()).toBe(0);
  });

  it('shows no count on the other pages', () => {
    for (const page of [
      Page.Home,
      Page.Settings,
      Page.Information,
      Page.Chords,
      Page.Accumulation,
    ]) {
      expect(service.getPageCount(page)()).toBe(0);
    }
  });
});
