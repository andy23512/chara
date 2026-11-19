import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SentenceCasePipe } from './sentence-case.pipe';

@Component({
  selector: 'app-sentence-case-host',
  imports: [SentenceCasePipe],
  template: `<span>{{ text | sentenceCase }}</span>`,
})
class HostComponent {
  text = 'delete all loaded chords';
}

describe('SentenceCasePipe', () => {
  const pipe = new SentenceCasePipe();

  it('capitalizes only the first letter', () => {
    expect(pipe.transform('delete all loaded chords')).toBe(
      'Delete all loaded chords',
    );
  });

  it('keeps the other letters as they are', () => {
    expect(pipe.transform('load USB device')).toBe('Load USB device');
  });

  it('gives an empty text for an empty text', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('does not trim, so a leading space stays (the first character is a space)', () => {
    expect(pipe.transform(' load')).toBe(' load');
  });

  it('leaves text that starts with something other than a letter as it is', () => {
    expect(pipe.transform('3 chords')).toBe('3 chords');
  });

  it('is used in a template under the name sentenceCase', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').textContent).toBe(
      'Delete all loaded chords',
    );
  });
});
