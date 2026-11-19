import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';
import { ChordKeyLabel, ChordKeyLabelType } from 'src/app/models/chord.models';
import { ChordKeyLabelsRendererComponent } from './chord-key-labels-renderer.component';

const label = (c: string): ChordKeyLabel => ({
  type: ChordKeyLabelType.Char,
  c,
  title: c,
});
const params = (value: ChordKeyLabel[]) =>
  ({ value }) as unknown as ICellRendererParams;

describe('ChordKeyLabelsRendererComponent', () => {
  let fixture: ComponentFixture<ChordKeyLabelsRendererComponent>;
  let component: ChordKeyLabelsRendererComponent;

  const labels = () =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        'app-chord-key-label',
      ),
    ).map((l) => l.textContent?.trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordKeyLabelsRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ChordKeyLabelsRendererComponent);
    component = fixture.componentInstance;
  });

  it('agInit renders one key label per value in order', () => {
    component.agInit(params([label('a'), label('b'), label('c')]));
    fixture.detectChanges();
    expect(labels()).toEqual(['a', 'b', 'c']);
  });

  it('renders nothing for an empty list', () => {
    component.agInit(params([]));
    fixture.detectChanges();
    expect(labels()).toEqual([]);
  });

  it('refresh replaces the value and returns true', () => {
    component.agInit(params([label('a')]));
    expect(component.refresh(params([label('x'), label('y')]))).toBeTrue();
    fixture.detectChanges();
    expect(labels()).toEqual(['x', 'y']);
  });
});
