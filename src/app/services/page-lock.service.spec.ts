import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Page } from '../models/page.models';
import { ChordStore } from '../stores/chord.store';
import { DeviceLayoutStore } from '../stores/device-layout.store';
import { ChordDataService } from './chord-data.service';
import { PageLockService } from './page-lock.service';

describe('PageLockService', () => {
  const layoutLoaded = signal(false);
  const chordCount = signal(0);
  const adaptationPassed = signal(0);
  const realizationPassed = signal(0);
  let service: PageLockService;

  beforeEach(() => {
    layoutLoaded.set(false);
    chordCount.set(0);
    adaptationPassed.set(0);
    realizationPassed.set(0);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DeviceLayoutStore,
          useValue: { hasLoadedProfileLayoutMap: layoutLoaded },
        },
        { provide: ChordStore, useValue: { entityCount: chordCount } },
        {
          provide: ChordDataService,
          useValue: {
            adaptationPhasePassedChordCount: adaptationPassed,
            realizationPhasePassedChordCount: realizationPassed,
          },
        },
      ],
    });
    service = TestBed.inject(PageLockService);
  });

  it('never locks the pages that do not need chords', () => {
    for (const page of [Page.Home, Page.Settings, Page.Information, Page.Chords]) {
      expect(service.canAccessPage(page)()).toBe(true);
    }
  });

  describe('adaptation page', () => {
    const can = () => service.canAccessPage(Page.Adaptation);

    it('is locked until both the device layout and chords are loaded', () => {
      const canAccess = can();
      expect(canAccess()).toBe(false);
      layoutLoaded.set(true);
      expect(canAccess()).toBe(false);
      chordCount.set(1);
      expect(canAccess()).toBe(true);
    });

    it('is locked with chords but no device layout', () => {
      chordCount.set(5);
      expect(can()()).toBe(false);
    });

    it('locks again when the chords are removed', () => {
      layoutLoaded.set(true);
      chordCount.set(1);
      const canAccess = can();
      expect(canAccess()).toBe(true);
      chordCount.set(0);
      expect(canAccess()).toBe(false);
    });
  });

  describe('realization page', () => {
    const can = () => service.canAccessPage(Page.Realization);

    it('opens once the device layout is loaded and an adaptation chord has passed', () => {
      const canAccess = can();
      expect(canAccess()).toBe(false);
      layoutLoaded.set(true);
      expect(canAccess()).toBe(false);
      adaptationPassed.set(1);
      expect(canAccess()).toBe(true);
    });

    it('does not depend on the number of chords in the store', () => {
      layoutLoaded.set(true);
      chordCount.set(100);
      expect(can()()).toBe(false);
    });

    it('stays locked without the device layout', () => {
      adaptationPassed.set(10);
      expect(can()()).toBe(false);
    });
  });

  describe('accumulation page', () => {
    const can = () => service.canAccessPage(Page.Accumulation);

    it('opens once the device layout is loaded and a realization chord has passed', () => {
      const canAccess = can();
      layoutLoaded.set(true);
      adaptationPassed.set(10);
      expect(canAccess()).toBe(false);
      realizationPassed.set(1);
      expect(canAccess()).toBe(true);
    });

    it('stays locked without the device layout', () => {
      realizationPassed.set(10);
      expect(can()()).toBe(false);
    });
  });
});
