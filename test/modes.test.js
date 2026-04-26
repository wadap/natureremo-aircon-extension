import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MODES, getMode, getModeIcon, getModeLabel } from '../modes.js';

describe('MODES', () => {
  it('contains all five modes in display order', () => {
    assert.deepEqual(MODES.map(m => m.key), ['auto', 'cool', 'warm', 'dry', 'blow']);
  });

  it('every mode has icon and label', () => {
    for (const m of MODES) {
      assert.ok(m.icon, `${m.key} has icon`);
      assert.ok(m.label, `${m.key} has label`);
    }
  });
});

describe('getMode', () => {
  it('returns the entry for a known key', () => {
    assert.equal(getMode('cool').key, 'cool');
  });

  it('returns undefined for an unknown key', () => {
    assert.equal(getMode('nope'), undefined);
  });
});

describe('getModeIcon', () => {
  it('returns the icon for known modes', () => {
    assert.equal(getModeIcon('cool'), '❄️');
    assert.equal(getModeIcon('warm'), '♨️');
    assert.equal(getModeIcon('dry'), '💧');
    assert.equal(getModeIcon('blow'), '🌀');
    assert.equal(getModeIcon('auto'), '🌡️');
  });

  it('returns the default for unknown / undefined modes', () => {
    assert.equal(getModeIcon(undefined), '🌡️');
    assert.equal(getModeIcon('xxx'), '🌡️');
  });
});

describe('getModeLabel', () => {
  it('returns the label for known modes', () => {
    assert.equal(getModeLabel('cool'), '冷房');
    assert.equal(getModeLabel('warm'), '暖房');
    assert.equal(getModeLabel('dry'), '除湿');
    assert.equal(getModeLabel('blow'), '送風');
    assert.equal(getModeLabel('auto'), '自動');
  });

  it('returns — for unknown / undefined modes', () => {
    assert.equal(getModeLabel(undefined), '—');
    assert.equal(getModeLabel('xxx'), '—');
  });
});
