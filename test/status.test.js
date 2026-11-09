import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractStatuses, statusPatchFromSettings, formatSubtitle } from '../status.js';

const selected = [
  { id: 'a', name: 'リビング' },
  { id: 'b', name: '寝室' }
];

describe('extractStatuses', () => {
  it('maps appliance settings to a status keyed by id', () => {
    const appliances = [
      {
        id: 'a',
        settings: { button: '', mode: 'cool', temp: '26', temp_unit: 'c' },
        aircon: { range: { modes: { cool: { temp: ['16', '30'] } } } }
      }
    ];
    const out = extractStatuses(appliances, selected);
    assert.deepEqual(out.a, {
      isOn: true,
      mode: 'cool',
      temp: '26',
      tempUnit: 'c',
      rangeModes: { cool: { temp: ['16', '30'] } }
    });
  });

  it('treats button "power-off" as off', () => {
    const appliances = [
      { id: 'a', settings: { button: 'power-off', mode: 'warm', temp: '22', temp_unit: 'c' } }
    ];
    assert.equal(extractStatuses(appliances, selected).a.isOn, false);
  });

  it('treats any non power-off button as on', () => {
    const appliances = [
      { id: 'a', settings: { button: '', mode: 'auto', temp: '0', temp_unit: 'c' } }
    ];
    assert.equal(extractStatuses(appliances, selected).a.isOn, true);
  });

  it('omits selected ids that are not present in appliances', () => {
    const appliances = [
      { id: 'a', settings: { button: '', mode: 'cool', temp: '26', temp_unit: 'c' } }
    ];
    const out = extractStatuses(appliances, selected);
    assert.ok('a' in out);
    assert.ok(!('b' in out));
  });

  it('omits appliances without settings', () => {
    const appliances = [{ id: 'a', aircon: { range: { modes: {} } } }];
    assert.deepEqual(extractStatuses(appliances, selected), {});
  });

  it('ignores appliances not in the selected list', () => {
    const appliances = [
      { id: 'z', settings: { button: '', mode: 'cool', temp: '26', temp_unit: 'c' } }
    ];
    assert.deepEqual(extractStatuses(appliances, selected), {});
  });

  it('leaves rangeModes undefined when the appliance has no aircon range', () => {
    const appliances = [
      { id: 'a', settings: { button: '', mode: 'cool', temp: '26', temp_unit: 'c' } }
    ];
    assert.equal(extractStatuses(appliances, selected).a.rangeModes, undefined);
  });

  it('returns an empty object for empty or missing inputs', () => {
    assert.deepEqual(extractStatuses([], selected), {});
    assert.deepEqual(extractStatuses(undefined, selected), {});
    assert.deepEqual(extractStatuses([], []), {});
  });
});

describe('statusPatchFromSettings', () => {
  it('maps an aircon_settings response to a partial status', () => {
    const settings = { button: '', mode: 'cool', temp: '26', temp_unit: 'c', vol: 'auto' };
    assert.deepEqual(statusPatchFromSettings(settings, true), {
      isOn: true,
      mode: 'cool',
      temp: '26',
      tempUnit: 'c'
    });
  });

  it('takes isOn from the requested action, not from the response', () => {
    const settings = { button: '', mode: 'warm', temp: '22', temp_unit: 'c' };
    assert.equal(statusPatchFromSettings(settings, false).isOn, false);
  });

  it('keeps an empty temp so dry/blow clear the cached temperature', () => {
    const settings = { button: '', mode: 'dry', temp: '', temp_unit: 'c' };
    assert.deepEqual(statusPatchFromSettings(settings, true), {
      isOn: true,
      mode: 'dry',
      temp: '',
      tempUnit: 'c'
    });
  });

  it('omits fields the response does not carry so cached values survive a merge', () => {
    assert.deepEqual(statusPatchFromSettings({ mode: 'cool' }, true), { isOn: true, mode: 'cool' });
    assert.deepEqual(statusPatchFromSettings({ mode: null, temp: null }, true), { isOn: true });
  });

  it('falls back to isOn only when the response is not an object', () => {
    assert.deepEqual(statusPatchFromSettings(undefined, false), { isOn: false });
    assert.deepEqual(statusPatchFromSettings(null, true), { isOn: true });
    assert.deepEqual(statusPatchFromSettings('ok', true), { isOn: true });
  });
});

describe('formatSubtitle', () => {
  it('joins mode label and temperature', () => {
    assert.equal(formatSubtitle({ mode: 'cool', temp: '26', tempUnit: 'c' }), '冷房 / 26°C');
  });

  it('uses °F for fahrenheit units', () => {
    assert.equal(formatSubtitle({ mode: 'warm', temp: '72', tempUnit: 'f' }), '暖房 / 72°F');
  });

  it('shows only the mode when the temperature is empty', () => {
    assert.equal(formatSubtitle({ mode: 'dry', temp: '', tempUnit: 'c' }), '除湿');
  });

  it('shows a dash when there is no status', () => {
    assert.equal(formatSubtitle(undefined), '—');
    assert.equal(formatSubtitle({}), '—');
  });
});
