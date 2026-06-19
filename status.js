// appliances API レスポンスから、選択済みエアコンの状態マップを生成する純関数。
// statuses[id] = { isOn, mode, temp, tempUnit, rangeModes }
//   rangeModes: appliance.aircon.range.modes — モード別の有効値定義（詳細画面で使用）
// settings を持たない appliance や、選択外 / 見つからない id は結果に含めない。
export function extractStatuses(appliances, selectedAircons) {
  const statuses = {};
  if (!Array.isArray(appliances) || !Array.isArray(selectedAircons)) {
    return statuses;
  }
  for (const ac of selectedAircons) {
    const found = appliances.find(a => a.id === ac.id);
    if (found && found.settings) {
      statuses[ac.id] = {
        isOn: found.settings.button !== 'power-off',
        mode: found.settings.mode,
        temp: found.settings.temp,
        tempUnit: found.settings.temp_unit,
        rangeModes: found.aircon?.range?.modes
      };
    }
  }
  return statuses;
}
