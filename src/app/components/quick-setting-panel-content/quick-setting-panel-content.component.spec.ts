import { ComponentFixture, TestBed } from '@angular/core/testing';
import { patchState } from '@ngrx/signals';
import { setAllEntities } from '@ngrx/signals/entities';
import { provideTranslateService } from '@ngx-translate/core';
import { Chord, convertChordInNumberListFormToChord } from 'tangent-cc-lib';
import { QuickSettingService } from 'src/app/services/quick-setting.service';
import { ChordStore } from 'src/app/stores/chord.store';
import { DeviceLayoutStore } from 'src/app/stores/device-layout.store';
import { QuickSettingPanelContentComponent } from './quick-setting-panel-content.component';

const chord = (a: number, b: number): Chord =>
  convertChordInNumberListFormToChord([
    [...Array(10).fill(0), a, b],
    [a, b],
  ]);

describe('QuickSettingPanelContentComponent', () => {
  let fixture: ComponentFixture<QuickSettingPanelContentComponent>;
  let chords: InstanceType<typeof ChordStore>;
  let layout: InstanceType<typeof DeviceLayoutStore>;
  let load: jasmine.Spy;

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const items = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('mat-list-item'),
    ) as HTMLElement[];
  const isRed = (el: HTMLElement) => !!el.querySelector('.\\!text-red-500');
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    load = jasmine.createSpy('load');
    await TestBed.configureTestingModule({
      imports: [QuickSettingPanelContentComponent],
      providers: [
        provideTranslateService(),
        {
          provide: QuickSettingService,
          useValue: { loadDeviceLayoutAndChordsFromDevice: load },
        },
      ],
    }).compileComponents();
    chords = TestBed.inject(ChordStore);
    layout = TestBed.inject(DeviceLayoutStore);
    fixture = TestBed.createComponent(QuickSettingPanelContentComponent);
    await settle();
  });

  it('starts loading from the device when the button is pressed', () => {
    expect(load).not.toHaveBeenCalled();
    (
      fixture.nativeElement.querySelector('button') as HTMLButtonElement
    ).click();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('shows both items in red when nothing is loaded', () => {
    expect(items().length).toBe(2);
    expect(items().every(isRed)).toBe(true);
    expect(text()).toContain('quick-setting.device-layout-non-loaded');
    expect(text()).not.toContain('quick-setting.device-layout-loaded');
  });

  it('marks the device layout as loaded once it is', async () => {
    layout.setProfileLayoutMap({ A: [[1], [1], [1]] } as never);
    await settle();
    expect(isRed(items()[0])).toBe(false);
    expect(text()).toContain('quick-setting.device-layout-loaded');
    expect(isRed(items()[1])).toBe(true); // chords are still missing
  });

  it('marks the chords as loaded once there are some', async () => {
    patchState(chords, setAllEntities([chord(97, 98)]));
    await settle();
    expect(isRed(items()[1])).toBe(false);
    expect(isRed(items()[0])).toBe(true); // the layout is still missing
  });

  it('shows no red item when both are loaded', async () => {
    layout.setProfileLayoutMap({ A: [[1], [1], [1]] } as never);
    patchState(chords, setAllEntities([chord(97, 98)]));
    await settle();
    expect(items().some(isRed)).toBe(false);
  });

  it('goes back to red when the data is removed again', async () => {
    layout.setProfileLayoutMap({ A: [[1], [1], [1]] } as never);
    patchState(chords, setAllEntities([chord(97, 98)]));
    await settle();
    layout.deleteProfileLayoutMap();
    await settle();
    expect(isRed(items()[0])).toBe(true);
  });
});
