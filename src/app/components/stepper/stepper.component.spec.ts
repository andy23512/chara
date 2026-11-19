import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepperComponent } from './stepper.component';

describe('StepperComponent', () => {
  let fixture: ComponentFixture<StepperComponent>;

  const dots = () =>
    Array.from(fixture.nativeElement.querySelectorAll('div')) as HTMLElement[];
  const filled = () =>
    dots()
      .map((d, i) => (d.classList.contains('bg-chara-500') ? i : -1))
      .filter((i) => i >= 0);
  function render(totalSteps: number, stepIndex: number) {
    fixture.componentRef.setInput('totalSteps', totalSteps);
    fixture.componentRef.setInput('stepIndex', stepIndex);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StepperComponent);
  });

  it('renders one dot per step', () => {
    render(4, 0);
    expect(dots().length).toBe(4);
  });

  it('fills only the dot at the current step index', () => {
    render(4, 2);
    expect(filled()).toEqual([2]);
  });

  it('moves the filled dot when the step index changes', () => {
    render(3, 0);
    expect(filled()).toEqual([0]);
    render(3, 1);
    expect(filled()).toEqual([1]);
  });

  it('fills no dot when the step index is out of range', () => {
    render(3, 5);
    expect(filled()).toEqual([]);
  });

  it('renders nothing for zero steps', () => {
    render(0, 0);
    expect(dots().length).toBe(0);
  });

  it('adds or removes dots when the total changes', () => {
    render(2, 0);
    render(5, 0);
    expect(dots().length).toBe(5);
    render(1, 0);
    expect(dots().length).toBe(1);
  });
});
