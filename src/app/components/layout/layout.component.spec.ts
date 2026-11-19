import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { POSITION_CODE_LAYOUT } from 'tangent-cc-lib';
import { SwitchComponent } from '../switch/switch.component';
import { LayoutComponent } from './layout.component';

/** One switch drawn on its own, to compare with the same switch in the layout. */
@Component({
  selector: 'app-lone-switch',
  imports: [SwitchComponent],
  template: `<svg>
    <g
      appSwitch
      [center]="center()"
      [rotationDirection]="direction()"
      [rotation]="rotation()"
      [positionCodeMap]="codes()"
    ></g>
  </svg>`,
})
class LoneSwitchComponent {
  center = input.required<{ x: number; y: number }>();
  direction = input.required<'cw' | 'ccw'>();
  rotation = input.required<number>();
  codes = input.required<any>();
}

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  // Sizes the component uses: 350 per cell and 35 between cells, in 10 columns.
  const WIDTH = 350 * 10 + 35 * 9;

  const svg = () => fixture.nativeElement.querySelector('svg') as SVGElement;
  const switches = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('g[appswitch]'),
    ) as SVGGElement[];
  /** The centre circle of a switch is the last circle in it. */
  const circleOf = (el: SVGGElement) => {
    const circles = el.querySelectorAll(':scope > circle');
    return circles[circles.length - 1] as SVGCircleElement;
  };
  const centerOf = (el: SVGGElement) => ({
    x: +circleOf(el).getAttribute('cx')!,
    y: +circleOf(el).getAttribute('cy')!,
  });
  async function setInput(name: string, value: unknown) {
    fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('with the third thumb switch (the default)', () => {
    it('draws 9 switches for each hand', () => {
      expect(switches().length).toBe(18);
    });

    it('lists the switches from the thumb to the little finger', () => {
      expect(component.switches()).toEqual([
        'thumbEnd',
        'thumbMid',
        'thumbTip',
        'index',
        'middle',
        'middleMid',
        'ring',
        'ringMid',
        'little',
      ]);
    });

    it('has 5 rows', () => {
      expect(component.gridRows()).toBe(5);
      expect(component.viewBoxHeight()).toBe(350 * 5 + 35 * 4);
    });

    it('sets the view box to the full size', () => {
      expect(svg().getAttribute('viewBox')).toBe(
        `0 0 ${WIDTH} ${350 * 5 + 35 * 4}`,
      );
    });
  });

  describe('without the third thumb switch', () => {
    beforeEach(() => setInput('showThumb3Switch', false));

    it('draws 8 switches for each hand, leaving out the thumb end', () => {
      expect(switches().length).toBe(16);
      expect(component.switches()).not.toContain('thumbEnd' as never);
      expect(component.switches()[0]).toBe('thumbMid');
    });

    it('has 4 rows, so the view box is shorter', () => {
      expect(component.gridRows()).toBe(4);
      expect(svg().getAttribute('viewBox')).toBe(
        `0 0 ${WIDTH} ${350 * 4 + 35 * 3}`,
      );
    });

    it('comes back when the switch is shown again', async () => {
      await setInput('showThumb3Switch', true);
      expect(switches().length).toBe(18);
    });
  });

  describe('switch places', () => {
    const cell = (n: number) => n * (350 + 35) + 175;
    const row = (n: number) => n * (350 + 35) + 175;
    const left = (sw: string) => component.switchCenter(sw as never, 'left');
    const right = (sw: string) => component.switchCenter(sw as never, 'right');

    it('puts the fingers of the left hand in four columns, little finger outermost', () => {
      expect(left('little')).toEqual({ x: cell(0), y: row(0.5) });
      expect(left('ring')).toEqual({ x: cell(1), y: row(0) });
      expect(left('ringMid')).toEqual({ x: cell(1), y: row(1) });
      expect(left('middle')).toEqual({ x: cell(2), y: row(0) });
      expect(left('middleMid')).toEqual({ x: cell(2), y: row(1) });
      expect(left('index')).toEqual({ x: cell(3), y: row(0.5) });
    });

    it('steps the thumb switches down and out, one row each', () => {
      expect(left('thumbTip')).toEqual({ x: cell(4) - 350 / 4, y: row(2) });
      expect(left('thumbMid')).toEqual({ x: cell(4) - 350 / 2, y: row(3) });
      expect(left('thumbEnd')).toEqual({
        x: cell(4) - (350 * 3) / 4,
        y: row(4),
      });
    });

    it('mirrors every switch of the right hand across the middle', () => {
      for (const sw of component.switches()) {
        expect(right(sw).y).toBe(left(sw).y);
        expect(right(sw).x).toBe(WIDTH - left(sw).x);
      }
    });

    it('keeps the two hands apart and the thumbs near the middle', () => {
      expect(left('thumbTip').x).toBeLessThan(WIDTH / 2);
      expect(right('thumbTip').x).toBeGreaterThan(WIDTH / 2);
      expect(left('little').x).toBeLessThan(left('thumbTip').x);
    });

    it('does not move a switch by asking twice (the result is a fresh object)', () => {
      const first = left('index');
      first.x = -1;
      expect(left('index').x).toBe(cell(3));
    });

    it('puts every switch inside the view box, with no two on the same spot', () => {
      const spots = new Set<string>();
      for (const side of ['left', 'right'] as const) {
        for (const sw of component.switches()) {
          const p = component.switchCenter(sw, side);
          expect(p.x).toBeGreaterThan(0);
          expect(p.x).toBeLessThan(WIDTH);
          expect(p.y).toBeGreaterThan(0);
          expect(p.y).toBeLessThan(component.viewBoxHeight());
          spots.add(`${p.x},${p.y}`);
        }
      }
      expect(spots.size).toBe(18);
    });
  });

  describe('drawing', () => {
    it('draws every switch at its place', () => {
      const drawn = switches().map(centerOf);
      const expected: { x: number; y: number }[] = [];
      for (const side of component.sides) {
        for (const sw of component.switches()) {
          expected.push(component.switchCenter(sw, side));
        }
      }
      expect(drawn).toEqual(expected);
    });

    it('draws the left hand first, then the right hand', () => {
      const xs = switches().map((s) => centerOf(s).x);
      expect(xs.slice(0, 9).every((x) => x < WIDTH / 2)).toBe(true);
      expect(xs.slice(9).every((x) => x > WIDTH / 2)).toBe(true);
    });

    it('turns the thumb switches by 10 degrees and no other switch', () => {
      expect(component.thumbRotationAngle).toBe(10);
      expect(component.nonThumbRotationAngle).toBe(0);
    });

    /** The outlines of the sectors of the switch at this place in the layout. */
    const outlinesInLayout = (sw: string, side: 'left' | 'right') => {
      const center = component.switchCenter(sw as never, side);
      const el = switches().find((s) => {
        const c = centerOf(s);
        return c.x === center.x && c.y === center.y;
      })!;
      return Array.from(el.querySelectorAll('path')).map((p) =>
        p.getAttribute('d'),
      );
    };
    const outlinesAlone = (
      sw: keyof typeof POSITION_CODE_LAYOUT.left,
      side: 'left' | 'right',
      direction: 'cw' | 'ccw',
      rotation: number,
    ) => {
      const lone = TestBed.createComponent(LoneSwitchComponent);
      lone.componentRef.setInput('center', component.switchCenter(sw, side));
      lone.componentRef.setInput('direction', direction);
      lone.componentRef.setInput('rotation', rotation);
      lone.componentRef.setInput('codes', POSITION_CODE_LAYOUT[side][sw]);
      lone.detectChanges();
      return Array.from(lone.nativeElement.querySelectorAll('path')).map((p) =>
        (p as SVGPathElement).getAttribute('d'),
      );
    };

    it('turns the left thumb clockwise and the right thumb counter-clockwise', () => {
      expect(outlinesInLayout('thumbTip', 'left')).toEqual(
        outlinesAlone('thumbTip', 'left', 'cw', 10),
      );
      expect(outlinesInLayout('thumbTip', 'right')).toEqual(
        outlinesAlone('thumbTip', 'right', 'ccw', 10),
      );
    });

    it('does not turn the fingers', () => {
      expect(outlinesInLayout('index', 'left')).toEqual(
        outlinesAlone('index', 'left', 'cw', 0),
      );
      expect(outlinesInLayout('index', 'right')).toEqual(
        outlinesAlone('index', 'right', 'ccw', 0),
      );
    });

    it('draws the two hands differently, so the check above is not empty', () => {
      expect(outlinesAlone('thumbTip', 'left', 'cw', 10)).not.toEqual(
        outlinesAlone('thumbTip', 'left', 'ccw', 10),
      );
      expect(outlinesAlone('thumbTip', 'left', 'cw', 10)).not.toEqual(
        outlinesAlone('thumbTip', 'left', 'cw', 0),
      );
    });
  });

  describe('highlight', () => {
    const highlightOf = (el: SVGGElement) =>
      circleOf(el).getAttribute('opacity');

    it('highlights nothing by default', () => {
      expect(switches().every((s) => highlightOf(s) === '0')).toBe(true);
    });

    it('lights the centre of the switch whose centre key is in the list', async () => {
      const code = POSITION_CODE_LAYOUT.left.index.c;
      await setInput('highlightedPositionCodes', [code]);
      const lit = switches().filter((s) => highlightOf(s) !== '0');
      expect(lit.length).toBe(1);
      expect(centerOf(lit[0])).toEqual(component.switchCenter('index', 'left'));
    });

    it('lights only the switches of the listed keys', async () => {
      const codes = [
        POSITION_CODE_LAYOUT.left.index.c,
        POSITION_CODE_LAYOUT.right.thumbTip.c,
      ];
      await setInput('highlightedPositionCodes', codes);
      expect(switches().filter((s) => highlightOf(s) !== '0').length).toBe(2);
    });

    it('lights nothing for a key that is not on this keyboard', async () => {
      await setInput('highlightedPositionCodes', [9999]);
      expect(switches().every((s) => highlightOf(s) === '0')).toBe(true);
    });

    it('goes dark again when the list is emptied', async () => {
      await setInput('highlightedPositionCodes', [
        POSITION_CODE_LAYOUT.left.index.c,
      ]);
      await setInput('highlightedPositionCodes', []);
      expect(switches().every((s) => highlightOf(s) === '0')).toBe(true);
    });
  });
});
