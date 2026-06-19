import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractStatuses } from '../status.js';

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
