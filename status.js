import { getModeLabel } from './modes.js';

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

// aircon_settings への POST 応答（更新後の settings）から、表示とキャッシュに当てる部分 status を作る純関数。
// isOn は応答の button ではなく要求した操作から決める。
// 応答に無い（null / undefined の）項目は含めないので、マージしても既存の値を消さない。
// 空文字の temp は「温度なし」（dry/blow）として意味があるのでそのまま残す。
export function statusPatchFromSettings(settings, isOn) {
  const patch = { isOn };
  if (!settings || typeof settings !== 'object') return patch;
  if (settings.mode != null) patch.mode = settings.mode;
  if (settings.temp != null) patch.temp = settings.temp;
  if (settings.temp_unit != null) patch.tempUnit = settings.temp_unit;
  return patch;
}

// 一覧カードのサブタイトル（「冷房 / 26°C」）。モードも温度も無ければ「—」。
export function formatSubtitle(status) {
  const modeLabel = getModeLabel(status?.mode);
  const unit = status?.tempUnit === 'f' ? '°F' : '°C';
  const tempText = status?.temp ? `${status.temp}${unit}` : '';
  return [modeLabel, tempText].filter(Boolean).join(' / ') || '—';
}
