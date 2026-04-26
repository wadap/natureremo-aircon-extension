// 詳細画面の温度計算（純関数）。UIに依存せず単体テスト可能。
//   auto: 相対温度 (-5 〜 +5、刻み 1)
//   その他: 絶対温度 (16〜30°C / 60〜86°F、刻み 0.5)

export function getTempRange(mode, tempUnit) {
  if (mode === 'auto') return { min: -5, max: 5, step: 1 };
  return tempUnit === 'f'
    ? { min: 60, max: 86, step: 0.5 }
    : { min: 16, max: 30, step: 0.5 };
}

export function getDefaultTemp(mode, tempUnit) {
  if (mode === 'auto') return 0;
  return tempUnit === 'f' ? 72 : 24;
}

// direction = +1 で上げ、-1 で下げ。範囲外には張り付き、null は初期値に置換。
export function stepTemp(current, direction, mode, tempUnit) {
  const range = getTempRange(mode, tempUnit);
  if (current === null) return getDefaultTemp(mode, tempUnit);
  const next = current + direction * range.step;
  if (next < range.min || next > range.max) return current;
  return Math.round(next * 10) / 10;
}

// 表示文字列に整形。
export function formatTemp(temp, mode, tempUnit) {
  const unitSuffix = tempUnit === 'f' ? '°F' : '°C';
  if (temp === null) {
    return { value: '--', unit: mode === 'auto' ? '' : unitSuffix };
  }
  if (mode === 'auto') {
    const prefix = temp > 0 ? '+' : '';
    return { value: prefix + temp.toFixed(0), unit: '' };
  }
  return {
    value: temp % 1 === 0 ? temp.toFixed(0) : temp.toFixed(1),
    unit: unitSuffix
  };
}
