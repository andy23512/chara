import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionVariant, KeyLabelType } from 'tangent-cc-lib';
import { ChordKeyLabel, ChordKeyLabelType } from 'src/app/models/chord.models';
import { ChordKeyLabelComponent } from './chord-key-label.component';

describe('ChordKeyLabelComponent', () => {
  let fixture: ComponentFixture<ChordKeyLabelComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  function render(label: ChordKeyLabel) {
    fixture.componentRef.setInput('chordKeyLabel', label);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChordKeyLabelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ChordKeyLabelComponent);
  });

  it('marks the host as positioned', () => {
    render({ type: ChordKeyLabelType.Char, c: 'a', title: 'a' });
    expect(el().classList).toContain('relative');
  });

  it('renders a char label as plain text', () => {
    render({ type: ChordKeyLabelType.Char, c: 'a', title: 'a' });
    const span = el().querySelector('span') as HTMLElement;
    expect(span.textContent).toBe('a');
    expect(span.classList.contains('underline')).toBeFalse();
    expect(span.classList.contains('bg-chara-900/50')).toBeFalse();
  });

  it('highlights a char label that is a Windows Alt key', () => {
    render({
      type: ChordKeyLabelType.Char,
      c: '1',
      title: '1',
      isWindowsAltKey: true,
    });
    expect((el().querySelector('span') as HTMLElement).classList).toContain(
      'bg-chara-900/50',
    );
  });

  it('renders a string label underlined', () => {
    render({ type: KeyLabelType.String, c: 'Tab', title: 'Tab' });
    const span = el().querySelector('span') as HTMLElement;
    expect(span.textContent).toBe('Tab');
    expect(span.classList).toContain('underline');
  });

  it('renders an icon label as a mat-icon', () => {
    render({ type: KeyLabelType.Icon, c: 'backspace' as any, title: 'bs' });
    const icon = el().querySelector('mat-icon') as HTMLElement;
    expect(icon.textContent).toBe('backspace');
    expect(el().querySelector('span')).toBeNull();
  });

  it('falls back to the JSON of unsupported label types', () => {
    const label = {
      type: KeyLabelType.ActionCode,
      c: 42,
      title: 'x',
    } as ChordKeyLabel;
    render(label);
    expect(el().textContent).toContain(
      JSON.stringify(label, null, 2).split('\n')[0],
    );
    expect(el().textContent).toContain('"c": 42');
    expect(el().querySelector('span')).toBeNull();
    expect(el().querySelector('mat-icon')).toBeNull();
  });

  it('shows no variant subscript when the label has no variant', () => {
    render({ type: ChordKeyLabelType.Char, c: 'a', title: 'a' });
    expect(el().querySelector('sub')).toBeNull();
  });

  it('shows L for the left variant', () => {
    render({
      type: ChordKeyLabelType.Char,
      c: 'a',
      title: 'a',
      variant: ActionVariant.Left,
    });
    expect(el().querySelector('sub')?.textContent?.trim()).toBe('L');
  });

  it('shows R for the right variant', () => {
    render({
      type: ChordKeyLabelType.Char,
      c: 'a',
      title: 'a',
      variant: ActionVariant.Right,
    });
    expect(el().querySelector('sub')?.textContent?.trim()).toBe('R');
  });

  it('updates when the input changes', () => {
    render({ type: ChordKeyLabelType.Char, c: 'a', title: 'a' });
    render({ type: ChordKeyLabelType.Char, c: 'b', title: 'b' });
    expect(el().querySelector('span')?.textContent).toBe('b');
  });
});
