import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchSectorComponent } from './switch-sector.component';

@Component({
  imports: [SwitchSectorComponent],
  template: `
    <svg>
      <g
        appSwitchSector
        [center]="{ x: 100, y: 200 }"
        [direction]="direction()"
        [degree]="degree()"
        [positionCode]="positionCode()"
        [strokeWidth]="strokeWidth()"
        [highlightPositionCodes]="highlight()"
        [highlightOpacity]="0.7"
      ></g>
    </svg>
  `,
})
class HostComponent {
  direction = signal<'cw' | 'ccw'>('cw');
  degree = signal(270);
  positionCode = signal(5);
  strokeWidth = signal(1);
  highlight = signal<number[]>([]);
}

describe('SwitchSectorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const paths = (): SVGPathElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('path'));
  const outline = () => paths()[0];
  const highlightPath = () => paths()[1];
  const sector = (): SwitchSectorComponent =>
    fixture.debugElement.children[0].children[0].injector.get(
      SwitchSectorComponent,
    );

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(sector()).toBeTruthy();
  });

  it('draws an outline and a highlight path', () => {
    expect(paths().length).toBe(2);
    expect(outline().getAttribute('fill')).toBe('transparent');
  });

  it('closes the highlight path but not the outline', () => {
    expect(outline().getAttribute('d')?.trim().endsWith('Z')).toBe(false);
    expect(highlightPath().getAttribute('d')?.trim().endsWith('Z')).toBe(true);
  });

  it('draws two arcs and a line for each sector', () => {
    const d = outline().getAttribute('d') ?? '';
    expect((d.match(/\bA\b/g) ?? []).length).toBe(2);
    expect((d.match(/\bL\b/g) ?? []).length).toBe(1);
    expect(d.trim().startsWith('M ')).toBe(true);
  });

  it('draws clockwise and counter-clockwise sectors with opposite arc sweeps', () => {
    const cw = outline().getAttribute('d');
    host.direction.set('ccw');
    fixture.detectChanges();
    const ccw = outline().getAttribute('d');
    expect(cw).not.toBe(ccw);
    expect(cw).toContain('0 0 1');
    expect(ccw).toContain('0 0 0');
  });

  it('is drawn around the center it is given', () => {
    const coordinates = (outline().getAttribute('d') ?? '')
      .match(/-?\d+(\.\d+)?(e-?\d+)?/g)!
      .map(Number);
    // the first M point is at radius 65 from (100, 200)
    const [x, y] = coordinates;
    expect(Math.hypot(x - 100, y - 200)).toBeCloseTo(65, 5);
  });

  it('moves the sector when the degree changes', () => {
    const before = outline().getAttribute('d');
    host.degree.set(0);
    fixture.detectChanges();
    expect(outline().getAttribute('d')).not.toBe(before);
  });

  it('shrinks the outer radius by the stroke width', () => {
    expect(sector().r2()).toBe(174);
    host.strokeWidth.set(5);
    fixture.detectChanges();
    expect(sector().r2()).toBe(170);
  });

  it('passes the stroke width to the outline', () => {
    host.strokeWidth.set(3);
    fixture.detectChanges();
    expect(outline().getAttribute('stroke-width')).toBe('3');
  });

  describe('highlight', () => {
    it('is invisible when the position code is not highlighted', () => {
      host.highlight.set([1, 2]);
      fixture.detectChanges();
      expect(highlightPath().getAttribute('opacity')).toBe('0');
    });

    it('uses the highlight opacity when the position code is highlighted', () => {
      host.highlight.set([1, 5]);
      fixture.detectChanges();
      expect(highlightPath().getAttribute('opacity')).toBe('0.7');
    });

    it('is invisible when nothing is highlighted', () => {
      expect(highlightPath().getAttribute('opacity')).toBe('0');
    });
  });

  describe('label position', () => {
    it('sits between the inner and outer radius, in the direction of the sector', () => {
      host.degree.set(0);
      fixture.detectChanges();
      const mid = (65 + 174) / 2;
      expect(sector().textX()).toBeCloseTo(100 + mid, 5);
      expect(sector().textY()).toBeCloseTo(200, 5);
    });
  });
});
