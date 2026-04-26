import { fetchAppliances, controlAC, setAirconSettings } from './api.js';
import { Storage } from './storage.js';
import { el, UI, showToast, withLoading } from './dom.js';
import { getModeIcon, getModeLabel, renderModeButtons } from './modes.js';
import { getTempRange, stepTemp, formatTemp } from './detail-temp.js';

// トークン入力画面
function initTokenView() {
  const tokenInput = document.getElementById('token-input');
  const btnConnect = document.getElementById('btn-connect');
  const tokenError = document.getElementById('token-error');

  btnConnect.addEventListener('click', async () => {
    const token = tokenInput.value.trim();

    if (!token) {
      tokenError.textContent = 'トークンを入力してください';
      tokenError.classList.remove('hidden');
      return;
    }

    tokenError.classList.add('hidden');

    try {
      await withLoading(btnConnect, '<span class="loading"></span> 接続中...', async () => {
        const appliances = await fetchAppliances(token);
        const aircons = appliances.filter(a => a.type === 'AC');

        if (aircons.length === 0) {
          throw new Error('エアコンが見つかりませんでした');
        }

        await Storage.set({ token, allAircons: aircons });
        await showDeviceSelectView(aircons);
      });
    } catch (error) {
      tokenError.textContent = error.message;
      tokenError.classList.remove('hidden');
    }
  });

  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      btnConnect.click();
    }
  });
}

// デバイス選択画面
async function showDeviceSelectView(aircons) {
  UI.showOnly('device-select-view');

  const deviceList = document.getElementById('device-list');
  const btnSave = document.getElementById('btn-save-devices');

  deviceList.replaceChildren(...aircons.map(ac => {
    const manuf = ac.model?.manufacturer || '';
    const modelName = ac.model?.name || '';
    return el('label', { class: 'device-item' }, [
      el('input', {
        type: 'checkbox',
        value: ac.id,
        dataset: { name: ac.nickname }
      }),
      el('div', { class: 'device-info' }, [
        el('div', { class: 'device-name', text: ac.nickname }),
        el('div', { class: 'device-detail', text: `${manuf} ${modelName}`.trim() })
      ])
    ]);
  }));

  // 前回の選択状態を復元
  const { selectedAircons } = await Storage.get(['selectedAircons']);
  if (selectedAircons && selectedAircons.length > 0) {
    const selectedIds = new Set(selectedAircons.map(a => a.id));
    deviceList.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.checked = selectedIds.has(input.value);
    });
  }

  // チェックボックス変更時（多重登録を避けるため onchange で上書き）
  deviceList.onchange = () => {
    const checked = deviceList.querySelectorAll('input:checked');
    btnSave.disabled = checked.length === 0;
  };
  deviceList.onchange();

  btnSave.onclick = async () => {
    const checked = deviceList.querySelectorAll('input:checked');
    const selected = Array.from(checked).map(input => ({
      id: input.value,
      name: input.dataset.name
    }));
    await Storage.set({ selectedAircons: selected });
    showMainView();
  };

  document.getElementById('btn-back-to-token').onclick = () => {
    UI.showOnly('token-view');
  };
}

// メイン操作画面
async function showMainView() {
  UI.showOnly('main-view');

  const { token, selectedAircons } = await Storage.get(['token', 'selectedAircons']);

  if (!token || !selectedAircons || selectedAircons.length === 0) {
    UI.showOnly('token-view');
    return;
  }

  // 現在の状態を取得
  // statuses[id] = { isOn: boolean, mode?: string, temp?, tempUnit? }
  let statuses = {};
  try {
    const appliances = await fetchAppliances(token);
    selectedAircons.forEach(ac => {
      const found = appliances.find(a => a.id === ac.id);
      if (found && found.settings) {
        statuses[ac.id] = {
          isOn: found.settings.button !== 'power-off',
          mode: found.settings.mode,
          temp: found.settings.temp,
          tempUnit: found.settings.temp_unit
        };
      }
    });
  } catch (error) {
    console.error('Status fetch failed:', error);
  }

  renderAirconList(selectedAircons, statuses, token);

  document.getElementById('btn-all-off').onclick = () => allOff(token, selectedAircons);

  document.getElementById('btn-settings').onclick = async () => {
    const { allAircons } = await Storage.get(['allAircons']);
    if (allAircons) {
      await showDeviceSelectView(allAircons);
    } else {
      UI.showOnly('token-view');
    }
  };
}

function renderAirconList(aircons, statuses, token) {
  const acList = document.getElementById('ac-list');

  acList.replaceChildren(...aircons.map(ac => {
    const st = statuses[ac.id];
    const isOn = st?.isOn ?? false;
    const icon = getModeIcon(st?.mode);
    const modeLabel = getModeLabel(st?.mode);
    const unit = st?.tempUnit === 'f' ? '°F' : '°C';
    const tempText = st?.temp ? `${st.temp}${unit}` : '';
    const subtitle = [modeLabel, tempText].filter(Boolean).join(' / ') || '—';

    return el('div', {
      class: 'room-card',
      role: 'button',
      tabindex: '0',
      'aria-label': `${ac.name}の詳細設定`,
      dataset: { id: ac.id }
    }, [
      el('div', { class: 'room-header' }, [
        el('span', { class: 'room-name', text: `${icon} ${ac.name}` }),
        el('div', { class: 'room-meta' }, [
          el('span', {
            class: `status ${isOn ? 'on' : 'off'}`,
            id: `status-${ac.id}`,
            text: isOn ? 'ON' : 'OFF'
          }),
          el('span', { class: 'drilldown-hint', 'aria-hidden': 'true', text: '詳細' }),
          el('span', { class: 'drilldown-arrow', 'aria-hidden': 'true', text: '›' })
        ])
      ]),
      el('div', {
        class: 'room-subtitle',
        id: `subtitle-${ac.id}`,
        text: subtitle
      }),
      el('div', { class: 'button-group' }, [
        el('button', {
          class: 'btn btn-on',
          dataset: { id: ac.id, action: 'on' },
          text: 'ON'
        }),
        el('button', {
          class: 'btn btn-off',
          dataset: { id: ac.id, action: 'off' },
          text: 'OFF'
        })
      ])
    ]);
  }));

  // ON/OFF ボタン
  acList.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const ac = aircons.find(a => a.id === id);
      const card = btn.closest('.room-card');
      const buttons = card.querySelectorAll('.btn');

      try {
        await withLoading(buttons, '<span class="loading"></span>', () => controlAC(token, id, action));
        updateStatus(id, action === 'on');
        showToast(`${ac.name}を${action === 'on' ? 'ON' : 'OFF'}にしました`);
      } catch (error) {
        const detail = error?.message ? ` (${error.message})` : '';
        showToast(`エラー: ${ac.name}の操作に失敗${detail}`, 'error');
      }
    });
  });

  // カードクリックで詳細へ（ドリルダウン）
  acList.querySelectorAll('.room-card').forEach(card => {
    const open = () => {
      const id = card.dataset.id;
      const ac = aircons.find(a => a.id === id);
      if (!ac) return;
      showDetailView({ ac, status: statuses[id], token });
    };

    card.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      open();
    });

    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
}

function updateStatus(id, isOn) {
  const status = document.getElementById(`status-${id}`);
  if (status) {
    status.textContent = isOn ? 'ON' : 'OFF';
    status.className = `status ${isOn ? 'on' : 'off'}`;
  }
}

async function allOff(token, aircons) {
  const btn = document.getElementById('btn-all-off');

  await withLoading(btn, '<span class="loading"></span> 処理中...', async () => {
    const results = await Promise.allSettled(
      aircons.map(ac => controlAC(token, ac.id, 'off'))
    );

    let successCount = 0;
    results.forEach((result, i) => {
      const ac = aircons[i];
      if (result.status === 'fulfilled') {
        updateStatus(ac.id, false);
        successCount++;
      } else {
        console.error(`Failed to turn off ${ac.name}:`, result.reason);
      }
    });

    if (successCount === aircons.length) {
      showToast('すべてOFFにしました');
    } else {
      showToast(`${successCount}/${aircons.length}台をOFFにしました`, 'error');
    }
  });
}

// 詳細設定画面
function showDetailView({ ac, status, token }) {
  UI.showOnly('detail-view');

  const title = document.getElementById('detail-title');
  const modeButtons = document.getElementById('detail-mode-buttons');
  renderModeButtons(modeButtons);
  const tempValueEl = document.getElementById('temp-value');
  const tempUnitEl = document.getElementById('temp-unit');
  const btnTempDown = document.getElementById('temp-down');
  const btnTempUp = document.getElementById('temp-up');
  const errorBox = document.getElementById('detail-error');
  const btnApply = document.getElementById('btn-apply-detail');
  const btnBack = document.getElementById('btn-back-to-main');

  let selectedMode = status?.mode || 'auto';
  const tempUnit = status?.tempUnit || 'c';

  // モード別に温度を保持（auto は相対、その他は絶対）
  let autoTemp = null;
  let absoluteTemp = null;
  if (status?.temp != null) {
    const parsed = parseFloat(status.temp);
    if (status?.mode === 'auto') autoTemp = parsed;
    else absoluteTemp = parsed;
  }

  title.textContent = `${getModeIcon(status?.mode)} ${ac.name}`;
  errorBox.classList.add('hidden');

  const getCurrentTemp = () => selectedMode === 'auto' ? autoTemp : absoluteTemp;
  const setCurrentTemp = (value) => {
    if (selectedMode === 'auto') autoTemp = value;
    else absoluteTemp = value;
  };

  function updateModeButtons() {
    modeButtons.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === selectedMode);
    });
  }

  function updateTempDisplay() {
    const temp = getCurrentTemp();
    const range = getTempRange(selectedMode, tempUnit);
    const { value, unit } = formatTemp(temp, selectedMode, tempUnit);
    tempValueEl.textContent = value;
    tempUnitEl.textContent = unit;
    btnTempDown.disabled = temp === null || temp <= range.min;
    btnTempUp.disabled = temp === null || temp >= range.max;
  }

  updateModeButtons();
  updateTempDisplay();

  modeButtons.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      selectedMode = btn.dataset.mode;
      updateModeButtons();
      updateTempDisplay();
    };
  });

  btnTempDown.onclick = () => {
    setCurrentTemp(stepTemp(getCurrentTemp(), -1, selectedMode, tempUnit));
    updateTempDisplay();
  };
  btnTempUp.onclick = () => {
    setCurrentTemp(stepTemp(getCurrentTemp(), +1, selectedMode, tempUnit));
    updateTempDisplay();
  };

  btnBack.onclick = () => showMainView();

  btnApply.onclick = async () => {
    errorBox.classList.add('hidden');
    try {
      await withLoading(btnApply, '<span class="loading"></span> 適用中...', async () => {
        const params = { button: '', operation_mode: selectedMode };
        const temp = getCurrentTemp();
        if (temp !== null) params.temperature = String(temp);
        await setAirconSettings(token, ac.id, params);
      });
      showToast(`${ac.name}の設定を更新しました`);
      await showMainView();
    } catch (error) {
      const detail = error?.message ? ` (${error.message})` : '';
      errorBox.textContent = `更新に失敗しました${detail}`;
      errorBox.classList.remove('hidden');
    }
  };
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  initTokenView();

  const { token, selectedAircons } = await Storage.get(['token', 'selectedAircons']);

  if (token && selectedAircons && selectedAircons.length > 0) {
    showMainView();
  } else if (token) {
    try {
      const appliances = await fetchAppliances(token);
      const aircons = appliances.filter(a => a.type === 'AC');
      await Storage.set({ allAircons: aircons });
      await showDeviceSelectView(aircons);
    } catch {
      UI.showOnly('token-view');
    }
  } else {
    UI.showOnly('token-view');
  }
});
