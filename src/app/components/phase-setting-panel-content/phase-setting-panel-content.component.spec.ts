import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Phase } from 'src/app/models/phase.models';
import { PhaseSettingStore } from 'src/app/stores/phase-setting.store';
import { PhaseSettingPanelContentComponent } from './phase-setting-panel-content.component';

describe('PhaseSettingPanelContentComponent', () => {
  let fixture: ComponentFixture<PhaseSettingPanelContentComponent>;
  let store: InstanceType<typeof PhaseSettingStore>;

  // The table has one row per setting (size, reps, speed) and one column per
  // phase (adaptation, realization), so the inputs come in this order.
  const inputs = () =>
    [...fixture.nativeElement.querySelectorAll('input')] as HTMLInputElement[];
  const ADAPTATION_SIZE = 0;
  const REALIZATION_SIZE = 1;
  const ADAPTATION_REPS = 2;

  function type(input: HTMLInputElement, value: string) {
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }
  async function leave(input: HTMLInputElement) {
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PhaseSettingPanelContentComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(PhaseSettingPanelContentComponent);
    store = TestBed.inject(PhaseSettingStore);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the current values in a 3 by 2 table of inputs', () => {
    expect(inputs().map((i) => i.value)).toEqual([
      '5',
      '5',
      '50',
      '50',
      '30',
      '50',
    ]);
  });

  it('sets a minimum of 3 on the practice set size fields only', () => {
    expect(inputs().map((i) => i.getAttribute('min'))).toEqual([
      '3',
      '3',
      null,
      null,
      null,
      null,
    ]);
  });

  describe('typing', () => {
    it('saves what is typed for the other settings straight away', () => {
      type(inputs()[ADAPTATION_REPS], '70');
      expect(store.adaptation().minRepsToPass).toBe(70);
    });

    it('does not correct the practice set size while typing', async () => {
      type(inputs()[ADAPTATION_SIZE], '1');
      expect(store.adaptation().practiceSetSize).toBe(1);
      expect(inputs()[ADAPTATION_SIZE].value).toBe('1');
      type(inputs()[ADAPTATION_SIZE], '10');
      expect(store.adaptation().practiceSetSize).toBe(10);
      await leave(inputs()[ADAPTATION_SIZE]);
      expect(store.adaptation().practiceSetSize).toBe(10);
      expect(inputs()[ADAPTATION_SIZE].value).toBe('10');
    });
  });

  describe('leaving the practice set size field', () => {
    it('raises a size that is too small, and shows it', async () => {
      type(inputs()[ADAPTATION_SIZE], '0');
      await leave(inputs()[ADAPTATION_SIZE]);
      expect(store.adaptation().practiceSetSize).toBe(3);
      expect(inputs()[ADAPTATION_SIZE].value).toBe('3');
    });

    it('uses 3 for an empty field', async () => {
      type(inputs()[REALIZATION_SIZE], '');
      await leave(inputs()[REALIZATION_SIZE]);
      expect(store.realization().practiceSetSize).toBe(3);
      expect(inputs()[REALIZATION_SIZE].value).toBe('3');
    });

    it('rounds a fractional size down', async () => {
      type(inputs()[ADAPTATION_SIZE], '7.8');
      await leave(inputs()[ADAPTATION_SIZE]);
      expect(store.adaptation().practiceSetSize).toBe(7);
    });

    it('corrects only the phase whose field was left', async () => {
      type(inputs()[ADAPTATION_SIZE], '0');
      type(inputs()[REALIZATION_SIZE], '1');
      await leave(inputs()[ADAPTATION_SIZE]);
      expect(store.adaptation().practiceSetSize).toBe(3);
      expect(store.realization().practiceSetSize).toBe(1);
    });

    it('does not write anything when the size is already fine', async () => {
      const set = spyOn(store, 'set').and.callThrough();
      await leave(inputs()[ADAPTATION_SIZE]);
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('leaving the other fields', () => {
    it('does not correct them', async () => {
      type(inputs()[ADAPTATION_REPS], '0');
      await leave(inputs()[ADAPTATION_REPS]);
      expect(store.adaptation().minRepsToPass).toBe(0);
    });
  });

  it('can be called directly for a phase', () => {
    store.set(Phase.Realization, 'practiceSetSize', 0);
    (
      fixture.componentInstance as PhaseSettingPanelContentComponent
    ).onSettingBlur(Phase.Realization, 'practiceSetSize');
    expect(store.realization().practiceSetSize).toBe(3);
  });
});
