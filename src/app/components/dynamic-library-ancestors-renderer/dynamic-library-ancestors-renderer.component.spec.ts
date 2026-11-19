import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { AncestorData } from 'src/app/models/chord.models';
import { DynamicLibraryAncestorsRendererComponent } from './dynamic-library-ancestors-renderer.component';

const ancestor = (textOutput: string) =>
  ({ textOutput }) as unknown as AncestorData;
const params = (value: AncestorData[]) =>
  ({ value }) as unknown as ICellRendererParams;

describe('DynamicLibraryAncestorsRendererComponent', () => {
  let fixture: ComponentFixture<DynamicLibraryAncestorsRendererComponent>;
  let component: DynamicLibraryAncestorsRendererComponent;

  const text = () =>
    (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicLibraryAncestorsRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicLibraryAncestorsRendererComponent);
    component = fixture.componentInstance;
  });

  it('agInit stores the cell value and renders it joined by ">"', () => {
    component.agInit(params([ancestor('a'), ancestor('b')]));
    fixture.detectChanges();
    expect(text()).toBe('a>b');
  });

  it('renders a single ancestor without a separator', () => {
    component.agInit(params([ancestor('a')]));
    fixture.detectChanges();
    expect(text()).toBe('a');
  });

  it('refresh replaces the value and reports it handled the update', () => {
    component.agInit(params([ancestor('a')]));
    expect(
      component.refresh(params([ancestor('x'), ancestor('y')])),
    ).toBeTrue();
    fixture.detectChanges();
    expect(text()).toBe('x>y');
  });
});
