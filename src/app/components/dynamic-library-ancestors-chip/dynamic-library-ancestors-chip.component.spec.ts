import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AncestorData } from 'src/app/models/chord.models';
import { DynamicLibraryAncestorsChipComponent } from './dynamic-library-ancestors-chip.component';

const ancestor = (textOutput: string) =>
  ({ textOutput }) as unknown as AncestorData;

describe('DynamicLibraryAncestorsChipComponent', () => {
  let fixture: ComponentFixture<DynamicLibraryAncestorsChipComponent>;

  const text = () =>
    (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
  function render(list: AncestorData[]) {
    fixture.componentRef.setInput('dynamicLibraryAncestors', list);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicLibraryAncestorsChipComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicLibraryAncestorsChipComponent);
  });

  it('shows only the DLib prefix when there are no ancestors', () => {
    render([]);
    expect(text()).toBe('DLib:');
  });

  it('shows a single ancestor without a separator', () => {
    render([ancestor('ab')]);
    expect(text()).toBe('DLib: ab');
  });

  it('separates multiple ancestors with ">" but not after the last one', () => {
    render([ancestor('a'), ancestor('b'), ancestor('c')]);
    expect(text()).toBe('DLib: a>b>c');
  });
});
