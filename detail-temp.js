// 詳細画面の温度計算（純関数）。UIに依存せず単体テスト可能。
// 各モードで有効な温度値は API の aircon.range.modes.<mode>.temp が真。
// rangeModes が取れない場合のみ汎用フォールバックを使う。

function fallbackValidTemps(mode, tempUnit) {
  if (mode === 'auto') return [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  if (mode === 'cool' || mode === 'warm') {
    return tempUnit === 'f'
      ? Array.from({ length: 27 }, (_, i) => 60 + i)   // 60..86 °F
      : Array.from({ length: 15 }, (_, i) => 16 + i);  // 16..30 °C
  }
  return []; // dry, blow など
}

// このモードで設定可能な温度値を昇順の数値配列で返す。
// 空配列ならこのモードは温度設定を受け付けない（dry/blow が典型）。
export function getValidTemps(rangeModes, mode, tempUnit) {
  const raw = rangeModes?.[mode]?.temp;
  if (!Array.isArray(raw)) return fallbackValidTemps(mode, tempUnit);
  return raw
    .map(s => parseFloat(s))
    .filter(n => !Number.isNaN(n))
    .sort((a, b) => a - b);
}

// 有効値配列内で current に最も近い値を返す。
export function clampToValid(current, validTemps) {
  if (validTemps.length === 0) return null;
  if (current === null) return null;
  let best = validTemps[0];
  let bestDiff = Math.abs(current - best);
  for (const v of validTemps) {
    const d = Math.abs(current - v);
    if (d < bestDiff) { bestDiff = d; best = v; }
  }
  return best;
}

// direction = +1 / -1 で隣接の有効値へ。null は中央値で初期化。
export function stepTemp(current, direction, validTemps) {
  if (validTemps.length === 0) return null;
  if (current === null) return validTemps[Math.floor(validTemps.length / 2)];
  const snapped = clampToValid(current, validTemps);
  const idx = validTemps.indexOf(snapped);
  const newIdx = Math.max(0, Math.min(validTemps.length - 1, idx + direction));
  return validTemps[newIdx];
}

export function isAtMin(current, validTemps) {
  if (validTemps.length === 0 || current === null) return true;
  return current <= validTemps[0];
}

export function isAtMax(current, validTemps) {
  if (validTemps.length === 0 || current === null) return true;
  return current >= validTemps[validTemps.length - 1];
}

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
