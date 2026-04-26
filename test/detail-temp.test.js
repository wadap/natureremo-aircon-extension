import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getValidTemps,
  clampToValid,
  stepTemp,
  isAtMin,
  isAtMax,
  formatTemp
} from '../detail-temp.js';

describe('getValidTemps', () => {
  it('returns parsed and sorted numbers from rangeModes', () => {
    const rangeModes = { cool: { temp: ['18', '17', '16'] } };
    assert.deepEqual(getValidTemps(rangeModes, 'cool', 'c'), [16, 17, 18]);
  });

  it('returns empty array when API explicitly says the mode has no temps', () => {
    const rangeModes = { dry: { temp: [] } };
    assert.deepEqual(getValidTemps(rangeModes, 'dry', 'c'), []);
  });

  it('falls back to integer 16-30 for cool/warm in C when rangeModes is missing', () => {
    const valid = getValidTemps(undefined, 'cool', 'c');
    assert.equal(valid[0], 16);
    assert.equal(valid[valid.length - 1], 30);
    assert.equal(valid.length, 15);
  });

  it('falls back to 60-86 for cool/warm in F when rangeModes is missing', () => {
    const valid = getValidTemps(undefined, 'warm', 'f');
    assert.equal(valid[0], 60);
    assert.equal(valid[valid.length - 1], 86);
  });

  it('falls back to -5..+5 for auto', () => {
    assert.deepEqual(getValidTemps(undefined, 'auto', 'c'), [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
  });

  it('returns empty fallback for dry/blow when rangeModes is missing', () => {
    assert.deepEqual(getValidTemps(undefined, 'dry', 'c'), []);
    assert.deepEqual(getValidTemps(undefined, 'blow', 'c'), []);
  });

  it('filters out non-numeric strings from API', () => {
    const rangeModes = { auto: { temp: ['-2', '-1', '', 'auto', '0', '1'] } };
    assert.deepEqual(getValidTemps(rangeModes, 'auto', 'c'), [-2, -1, 0, 1]);
  });

  it('respects API-provided 0.5 step values', () => {
    const rangeModes = { cool: { temp: ['16', '16.5', '17'] } };
    assert.deepEqual(getValidTemps(rangeModes, 'cool', 'c'), [16, 16.5, 17]);
  });
});

describe('clampToValid', () => {
  it('returns null for empty validTemps', () => {
    assert.equal(clampToValid(24, []), null);
  });

  it('returns null for null current', () => {
    assert.equal(clampToValid(null, [16, 17, 18]), null);
  });

  it('returns the value itself when already in array', () => {
    assert.equal(clampToValid(20, [16, 18, 20, 22]), 20);
  });

  it('returns nearest neighbor when current is between values', () => {
    assert.equal(clampToValid(24.5, [16, 17, 18, 24, 25]), 24);
    assert.equal(clampToValid(24.6, [16, 17, 18, 24, 25]), 25);
  });

  it('clamps below min to min', () => {
    assert.equal(clampToValid(10, [16, 17, 18]), 16);
  });

  it('clamps above max to max', () => {
    assert.equal(clampToValid(99, [16, 17, 18]), 18);
  });
});

describe('stepTemp', () => {
  const range = [16, 17, 18, 19, 20];

  it('returns null when validTemps is empty', () => {
    assert.equal(stepTemp(20, +1, []), null);
  });

  it('returns the middle value when current is null', () => {
    assert.equal(stepTemp(null, +1, range), 18);
  });

  it('moves to next valid value on +1', () => {
    assert.equal(stepTemp(17, +1, range), 18);
  });

  it('moves to previous valid value on -1', () => {
    assert.equal(stepTemp(17, -1, range), 16);
  });

  it('stays at min when stepping down at min', () => {
    assert.equal(stepTemp(16, -1, range), 16);
  });

  it('stays at max when stepping up at max', () => {
    assert.equal(stepTemp(20, +1, range), 20);
  });

  it('snaps non-aligned current to nearest, then steps', () => {
    // 17.3 closest to 17 → step +1 → 18
    assert.equal(stepTemp(17.3, +1, range), 18);
    // 17.6 closest to 18 → step -1 → 17
    assert.equal(stepTemp(17.6, -1, range), 17);
  });
});

describe('isAtMin / isAtMax', () => {
  const range = [16, 17, 18];

  it('returns true for null current (so buttons stay disabled)', () => {
    assert.equal(isAtMin(null, range), true);
    assert.equal(isAtMax(null, range), true);
  });

  it('returns true for empty range', () => {
    assert.equal(isAtMin(20, []), true);
    assert.equal(isAtMax(20, []), true);
  });

  it('returns true at the boundary', () => {
    assert.equal(isAtMin(16, range), true);
    assert.equal(isAtMax(18, range), true);
  });

  it('returns false in the middle', () => {
    assert.equal(isAtMin(17, range), false);
    assert.equal(isAtMax(17, range), false);
  });

  it('treats values below min as at-min (boundary clamp)', () => {
    assert.equal(isAtMin(10, range), true);
    assert.equal(isAtMax(99, range), true);
  });
});

describe('formatTemp', () => {
  it('returns -- with empty unit when null in auto', () => {
    assert.deepEqual(formatTemp(null, 'auto', 'c'), { value: '--', unit: '' });
  });

  it('returns -- with °C when null in cool', () => {
    assert.deepEqual(formatTemp(null, 'cool', 'c'), { value: '--', unit: '°C' });
  });

  it('returns -- with °F when null in warm with f unit', () => {
    assert.deepEqual(formatTemp(null, 'warm', 'f'), { value: '--', unit: '°F' });
  });

  it('formats integer absolute temp without decimal', () => {
    assert.deepEqual(formatTemp(24, 'cool', 'c'), { value: '24', unit: '°C' });
  });

  it('formats half-step absolute temp with one decimal', () => {
    assert.deepEqual(formatTemp(24.5, 'cool', 'c'), { value: '24.5', unit: '°C' });
  });

  it('uses °F when tempUnit is f', () => {
    assert.deepEqual(formatTemp(72, 'cool', 'f'), { value: '72', unit: '°F' });
  });

  it('prefixes positive auto with +', () => {
    assert.deepEqual(formatTemp(3, 'auto', 'c'), { value: '+3', unit: '' });
  });

  it('keeps negative auto sign', () => {
    assert.deepEqual(formatTemp(-2, 'auto', 'c'), { value: '-2', unit: '' });
  });

  it('shows 0 without sign in auto', () => {
    assert.deepEqual(formatTemp(0, 'auto', 'c'), { value: '0', unit: '' });
  });
});
