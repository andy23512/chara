import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { AncestorData, ChordKeyLabel } from 'src/app/models/chord.models';
import { ChordKeyLabelType } from 'src/app/models/chord.models';
import { CompoundAncestorsRendererComponent } from './compound-ancestors-renderer.component';

const label = (c: string): ChordKeyLabel => ({
  type: ChordKeyLabelType.Char,
  c,
  title: c,
});
const ancestor = (...cs: string[]) =>
  ({ inputKeyLabels: cs.map(label) }) as unknown as AncestorData;
const params = (value: AncestorData[]) =>
  ({ value }) as unknown as ICellRendererParams;

describe('CompoundAncestorsRendererComponent', () => {
  let fixture: ComponentFixture<CompoundAncestorsRendererComponent>;
  let component: CompoundAncestorsRendererComponent;

  const el = () => fixture.nativeElement as HTMLElement;
  const labels = () =>
    Array.from(el().querySelectorAll('app-chord-key-label')).map((l) =>
      l.textContent?.trim(),
    );
  const separators = () => el().querySelectorAll('span.border-l').length;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompoundAncestorsRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CompoundAncestorsRendererComponent);
    component = fixture.componentInstance;
  });

  it('renders every key label of every ancestor in order', () => {
    component.agInit(params([ancestor('a', 'b'), ancestor('c')]));
    fixture.detectChanges();
    expect(labels()).toEqual(['a', 'b', 'c']);
  });

  it('puts a divider between ancestors but not after the last', () => {
    component.agInit(params([ancestor('a'), ancestor('b'), ancestor('c')]));
    fixture.detectChanges();
    expect(separators()).toBe(2);
  });

  it('has no divider for a single ancestor', () => {
    component.agInit(params([ancestor('a')]));
    fixture.detectChanges();
    expect(separators()).toBe(0);
  });

  it('refresh replaces the value and returns true', () => {
    component.agInit(params([ancestor('a')]));
    expect(
      component.refresh(params([ancestor('x'), ancestor('y')])),
    ).toBeTrue();
    fixture.detectChanges();
    expect(labels()).toEqual(['x', 'y']);
    expect(separators()).toBe(1);
  });
});
