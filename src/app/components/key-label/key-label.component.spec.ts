import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import {
  HighlightKeyCombination,
  KeyLabel,
  KeyLabelType,
  Layer,
} from 'tangent-cc-lib';
import { KeyLabelComponent } from './key-label.component';

const label = (over: Partial<KeyLabel> & Pick<KeyLabel, 'type' | 'c'>) =>
  ({
    title: 'tooltip',
    layer: Layer.Primary,
    shiftKey: false,
    altGraphKey: false,
    ...over,
  }) as KeyLabel;

const highlight = (
  over: Partial<HighlightKeyCombination> = {},
): HighlightKeyCombination => ({
  characterKeyPositionCode: 1,
  layer: Layer.Primary,
  shiftKey: false,
  altGraphKey: false,
  positionCodes: [],
  score: 0,
  ...over,
});

describe('KeyLabelComponent', () => {
  let fixture: ComponentFixture<KeyLabelComponent>;
  let component: KeyLabelComponent;

  function create(
    labels: KeyLabel[],
    highlightKeyCombination: HighlightKeyCombination | null = null,
    fontSize?: number,
  ) {
    fixture = TestBed.createComponent(KeyLabelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('x', 10);
    fixture.componentRef.setInput('y', 20);
    fixture.componentRef.setInput('labels', labels);
    fixture.componentRef.setInput(
      'highlightKeyCombination',
      highlightKeyCombination,
    );
    if (fontSize !== undefined) {
      fixture.componentRef.setInput('fontSize', fontSize);
    }
    fixture.detectChanges();
  }

  const texts = (): SVGTextElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('text'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KeyLabelComponent],
      providers: [provideTranslateService()],
    });
  });

  it('should create', () => {
    create([]);
    expect(component).toBeTruthy();
  });

  describe('isLabelActive', () => {
    beforeEach(() => create([]));
    const a = label({ type: KeyLabelType.String, c: 'a' });

    it('is false when nothing is highlighted', () => {
      expect(component.isLabelActive(a)).toBeFalsy();
    });

    it('is true when layer, Shift and AltGraph all match the highlight', () => {
      fixture.componentRef.setInput('highlightKeyCombination', highlight());
      expect(component.isLabelActive(a)).toBeTruthy();
    });

    it('is false when the layer differs', () => {
      fixture.componentRef.setInput(
        'highlightKeyCombination',
        highlight({ layer: Layer.Secondary }),
      );
      expect(component.isLabelActive(a)).toBeFalsy();
    });

    it('is false when Shift differs', () => {
      fixture.componentRef.setInput(
        'highlightKeyCombination',
        highlight({ shiftKey: true }),
      );
      expect(component.isLabelActive(a)).toBeFalsy();
    });

    it('is false when AltGraph differs', () => {
      fixture.componentRef.setInput(
        'highlightKeyCombination',
        highlight({ altGraphKey: true }),
      );
      expect(component.isLabelActive(a)).toBeFalsy();
    });

    it('is always true for a label that belongs to no layer', () => {
      fixture.componentRef.setInput(
        'highlightKeyCombination',
        highlight({ layer: Layer.Quaternary, shiftKey: true }),
      );
      expect(
        component.isLabelActive(
          label({ type: KeyLabelType.String, c: 'a', layer: null }),
        ),
      ).toBeTruthy();
    });
  });

  describe('getFontSize', () => {
    beforeEach(() => create([], null, 100));
    const size = (type: KeyLabelType, c: string | number) =>
      component.getFontSize(label({ type, c } as never));

    it('uses the full size for a one character string', () => {
      expect(size(KeyLabelType.String, 'a')).toBe(100);
    });

    it('shrinks two character strings to 80%', () => {
      expect(size(KeyLabelType.String, 'ab')).toBe(80);
    });

    it('shrinks longer strings to 60%', () => {
      expect(size(KeyLabelType.String, 'abc')).toBe(60);
      expect(size(KeyLabelType.String, 'abcdef')).toBe(60);
    });

    it('uses 60% for action codes', () => {
      expect(size(KeyLabelType.ActionCode, 123)).toBe(60);
    });

    it('uses 80% for icons and logos', () => {
      expect(size(KeyLabelType.Icon, 'backspace')).toBe(80);
      expect(size(KeyLabelType.Logo, 'logo-x')).toBe(80);
    });

    it('defaults the base size to 80', () => {
      create([]);
      expect(
        component.getFontSize(label({ type: KeyLabelType.String, c: 'a' })),
      ).toBe(80);
    });

    it('throws for an unknown label type', () => {
      expect(() => size('mystery' as KeyLabelType, 'a')).toThrowError(
        /Unhandled key label type/,
      );
    });
  });

  describe('rendering', () => {
    it('draws one text element per label at the given position', () => {
      create([
        label({ type: KeyLabelType.String, c: 'a' }),
        label({ type: KeyLabelType.String, c: 'b' }),
      ]);
      expect(texts().map((t) => t.textContent?.trim())).toEqual(['a', 'b']);
      expect(texts()[0].getAttribute('x')).toBe('10');
      expect(texts()[0].getAttribute('y')).toBe('20');
    });

    it('draws nothing for no labels', () => {
      create([]);
      expect(texts()).toEqual([]);
    });

    it('writes action codes in parentheses', () => {
      create([label({ type: KeyLabelType.ActionCode, c: 123 })]);
      expect(texts()[0].textContent?.replace(/\s+/g, '')).toBe('(123)');
    });

    it('uses the icon font for icon labels', () => {
      create([label({ type: KeyLabelType.Icon, c: 'backspace' })]);
      expect(texts()[0].classList.contains('material-icons')).toBe(true);
    });

    it('colors action codes red and other labels with the current color', () => {
      create([
        label({ type: KeyLabelType.ActionCode, c: 1 }),
        label({ type: KeyLabelType.String, c: 'a' }),
      ]);
      expect(texts()[0].classList.contains('fill-red-500')).toBe(true);
      expect(texts()[1].classList.contains('fill-current')).toBe(true);
    });

    it('shows only the labels of the highlighted layer', () => {
      create(
        [
          label({ type: KeyLabelType.String, c: 'a', layer: Layer.Primary }),
          label({ type: KeyLabelType.String, c: 'b', layer: Layer.Secondary }),
        ],
        highlight(),
      );
      expect(texts().map((t) => t.getAttribute('opacity'))).toEqual(['1', '0']);
    });

    it('hides every label when nothing is highlighted', () => {
      create([label({ type: KeyLabelType.String, c: 'a' })]);
      expect(texts()[0].getAttribute('opacity')).toBe('0');
    });
  });
});
