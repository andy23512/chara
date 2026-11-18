import { prefixStorageKey } from './store.utils';

describe('prefixStorageKey', () => {
  it('puts the app name in front of the key', () => {
    expect(prefixStorageKey('chordLabel')).toBe('chara-chordLabel');
  });

  it('keeps the key as it is, even when it is empty', () => {
    expect(prefixStorageKey('')).toBe('chara-');
    expect(prefixStorageKey('a-b c')).toBe('chara-a-b c');
  });

  it('does not use the prefix of the Lite app, so the two apps do not share saved data', () => {
    expect(prefixStorageKey('x').startsWith('chara-lite-')).toBe(false);
  });
});
