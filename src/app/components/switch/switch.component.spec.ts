import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectionMap } from 'tangent-cc-lib';
import { SwitchComponent } from './switch.component';

const POSITION_CODES: DirectionMap<number> = { n: 1, e: 2, s: 3, w: 4, c: 5 };

@Component({
  imports: [SwitchComponent],
  template: `
    <svg>
      <g
        appSwitch
        [center]="{ x: 100, y: 200 }"
        [rotationDirection]="direction()"
        [rotation]="rotation()"
        [positionCodeMap]="positionCodes"
        [highlightPositionCodes]="highlight()"
        [highlightOpacity]="0.6"
      ></g>
    </svg>
  `,
})
class HostComponent {
  direction = signal<'cw' | 'ccw'>('cw');
  rotation = signal(0);
  highlight = signal<number[]>([]);
  positionCodes = POSITION_CODES;
}

describe('SwitchComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const sectors = (): SVGGElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('g[appswitchsector]'));
  const centerCircle = (): SVGCircleElement =>
    fixture.nativeElement.querySelector('circle');
  const sectorOpacities = () =>
    sectors().map((g) => g.querySelectorAll('path')[1].getAttribute('opacity'));
  const component = (): SwitchComponent =>
    fixture.debugElement.children[0].children[0].injector.get(SwitchComponent);

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component()).toBeTruthy();
  });

  it('draws four sectors and a center circle', () => {
    expect(sectors().length).toBe(4);
    expect(fixture.nativeElement.querySelectorAll('circle').length).toBe(1);
  });

  it('places the sectors north, east, south and west at 270, 0, 90 and 180 degrees', () => {
    expect(component().sectors).toEqual([
      { direction: 'n', degree: 270 },
      { direction: 'e', degree: 0 },
      { direction: 's', degree: 90 },
      { direction: 'w', degree: 180 },
    ]);
  });

  describe('rotation', () => {
    it('rotates clockwise switches by the given angle', () => {
      host.rotation.set(30);
      fixture.detectChanges();
      expect(component().r()).toBe(30);
    });

    it('rotates counter-clockwise switches the other way', () => {
      host.direction.set('ccw');
      host.rotation.set(30);
      fixture.detectChanges();
      expect(component().r()).toBe(-30);
    });

    it('does not rotate by default', () => {
      expect(component().r()).toBe(0);
    });

    it('changes the drawn sectors when rotated', () => {
      const before = sectors().map((g) => g.querySelector('path')!.getAttribute('d'));
      host.rotation.set(45);
      fixture.detectChanges();
      const after = sectors().map((g) => g.querySelector('path')!.getAttribute('d'));
      expect(after).not.toEqual(before);
    });
  });

  describe('highlight', () => {
    it('highlights only the sector whose position code is highlighted', () => {
      host.highlight.set([3]); // south
      fixture.detectChanges();
      expect(sectorOpacities()).toEqual(['0', '0', '0.6', '0']);
      expect(centerCircle().getAttribute('opacity')).toBe('0');
    });

    it('highlights the center circle for the center position code', () => {
      host.highlight.set([5]);
      fixture.detectChanges();
      expect(centerCircle().getAttribute('opacity')).toBe('0.6');
      expect(sectorOpacities()).toEqual(['0', '0', '0', '0']);
    });

    it('can highlight several position codes at once', () => {
      host.highlight.set([1, 4, 5]);
      fixture.detectChanges();
      expect(sectorOpacities()).toEqual(['0.6', '0', '0', '0.6']);
      expect(centerCircle().getAttribute('opacity')).toBe('0.6');
    });

    it('highlights nothing by default', () => {
      expect(sectorOpacities()).toEqual(['0', '0', '0', '0']);
      expect(centerCircle().getAttribute('opacity')).toBe('0');
    });
  });

  it('draws the center circle at the given center', () => {
    expect(centerCircle().getAttribute('cx')).toBe('100');
    expect(centerCircle().getAttribute('cy')).toBe('200');
  });
});
