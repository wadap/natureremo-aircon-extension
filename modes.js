import { el } from './dom.js';

// 運転モードの単一定義（表示順）。
// アイコン・ラベル・詳細画面のモードボタンはすべてここから生成する。
export const MODES = [
  { key: 'auto', icon: '🌡️', label: '自動' },
  { key: 'cool', icon: '❄️', label: '冷房' },
  { key: 'warm', icon: '♨️', label: '暖房' },
  { key: 'dry',  icon: '💧', label: '除湿' },
  { key: 'blow', icon: '🌀', label: '送風' }
];

export function getMode(key) {
  return MODES.find(m => m.key === key);
}

export function getModeIcon(mode) {
  return getMode(mode)?.icon ?? '🌡️';
}

export function getModeLabel(mode) {
  return getMode(mode)?.label ?? '—';
}

export function renderModeButtons(container) {
  container.replaceChildren(...MODES.map(m => el('button', {
    type: 'button',
    class: 'mode-btn',
    dataset: { mode: m.key }
  }, [
    el('span', { class: 'mode-icon', text: m.icon }),
    el('span', { class: 'mode-label', text: m.label })
  ])));
}
