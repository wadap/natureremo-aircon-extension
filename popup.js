const API_BASE = 'https://api.nature.global/1';

// ストレージ操作
const Storage = {
  async get(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  },
  async set(data) {
    return new Promise(resolve => {
      chrome.storage.local.set(data, resolve);
    });
  },
  async clear() {
    return new Promise(resolve => {
      chrome.storage.local.clear(resolve);
    });
  }
};

// UI操作
const UI = {
  show(id) {
    document.getElementById(id).classList.remove('hidden');
  },
  hide(id) {
    document.getElementById(id).classList.add('hidden');
  },
  showOnly(id) {
    ['loading-view', 'token-view', 'device-select-view', 'main-view'].forEach(viewId => {
      if (viewId === id) {
        this.show(viewId);
      } else {
        this.hide(viewId);
      }
    });
  }
};

// トースト表示
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// API呼び出し
async function fetchAppliances(token) {
  const response = await fetch(`${API_BASE}/appliances`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('トークンが無効です');
    }
    throw new Error(`API エラー: ${response.status}`);
  }
  
  return response.json();
}

async function controlAC(token, applianceId, action) {
  const body = action === 'on' ? 'button=' : 'button=power-off';
  
  const response = await fetch(`${API_BASE}/appliances/${applianceId}/aircon_settings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  
  if (!response.ok) {
    throw new Error(`操作に失敗: ${response.status}`);
  }
  
  return response.json();
}

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

    btnConnect.disabled = true;
    btnConnect.innerHTML = '<span class="loading"></span> 接続中...';
    tokenError.classList.add('hidden');

    try {
      const appliances = await fetchAppliances(token);
      const aircons = appliances.filter(a => a.type === 'AC');
      
      if (aircons.length === 0) {
        tokenError.textContent = 'エアコンが見つかりませんでした';
        tokenError.classList.remove('hidden');
        return;
      }

      await Storage.set({ token, allAircons: aircons });
      await showDeviceSelectView(aircons);
    } catch (error) {
      tokenError.textContent = error.message;
      tokenError.classList.remove('hidden');
    } finally {
      btnConnect.disabled = false;
      btnConnect.textContent = '接続';
    }
  });

  // Enterキーで接続
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
  
  deviceList.innerHTML = aircons.map(ac => `
    <label class="device-item">
      <input type="checkbox" value="${ac.id}" data-name="${ac.nickname}">
      <div class="device-info">
        <div class="device-name">${ac.nickname}</div>
        <div class="device-detail">${ac.model?.manufacturer || ''} ${ac.model?.name || ''}</div>
      </div>
    </label>
  `).join('');

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

  // 初期状態のボタン活性を反映
  deviceList.onchange();

  // 保存ボタン
  btnSave.onclick = async () => {
    const checked = deviceList.querySelectorAll('input:checked');
    const selectedAircons = Array.from(checked).map(input => ({
      id: input.value,
      name: input.dataset.name
    }));

    await Storage.set({ selectedAircons });
    showMainView();
  };

  // 戻るボタン
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
  // statuses[id] = { isOn: boolean, mode?: string }
  let statuses = {};
  try {
    const appliances = await fetchAppliances(token);
    selectedAircons.forEach(ac => {
      const found = appliances.find(a => a.id === ac.id);
      if (found && found.settings) {
        statuses[ac.id] = {
          isOn: found.settings.button !== 'power-off',
          mode: found.settings.mode
        };
      }
    });
  } catch (error) {
    console.error('Status fetch failed:', error);
  }

  renderAirconList(selectedAircons, statuses, token);
  
  // すべてOFFボタン
  document.getElementById('btn-all-off').onclick = () => allOff(token, selectedAircons);
  
  // 設定ボタン
  document.getElementById('btn-settings').onclick = async () => {
    const { allAircons } = await Storage.get(['allAircons']);
    if (allAircons) {
      await showDeviceSelectView(allAircons);
    } else {
      UI.showOnly('token-view');
    }
  };
}

function getModeIcon(mode) {
  switch (mode) {
    case 'cool':
      return '❄️';
    case 'warm':
      return '♨️';
    case 'dry':
      return '💧';
    case 'blow':
      return '🌀';
    case 'auto':
      return '🌡️';
    default:
      return '🌡️';
  }
}

function renderAirconList(aircons, statuses, token) {
  const acList = document.getElementById('ac-list');
  
  acList.innerHTML = aircons.map(ac => {
    const st = statuses[ac.id];
    const isOn = st?.isOn ?? false;
    const icon = getModeIcon(st?.mode);

    return `
      <div class="room-card" data-id="${ac.id}">
        <div class="room-header">
          <span class="room-name">${icon} ${ac.name}</span>
          <span class="status ${isOn ? 'on' : 'off'}" id="status-${ac.id}">${isOn ? 'ON' : 'OFF'}</span>
        </div>
        <div class="button-group">
          <button class="btn btn-on" data-id="${ac.id}" data-action="on">ON</button>
          <button class="btn btn-off" data-id="${ac.id}" data-action="off">OFF</button>
        </div>
      </div>
    `;
  }).join('');

  // ボタンイベント
  acList.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const ac = aircons.find(a => a.id === id);
      
      setButtonsLoading(id, true);
      
      try {
        await controlAC(token, id, action);
        updateStatus(id, action === 'on');
        showToast(`${ac.name}を${action === 'on' ? 'ON' : 'OFF'}にしました`);
      } catch (error) {
        const detail = error?.message ? ` (${error.message})` : '';
        showToast(`エラー: ${ac.name}の操作に失敗${detail}`, 'error');
      } finally {
        setButtonsLoading(id, false);
      }
    });
  });
}

function setButtonsLoading(id, loading) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (!card) return;
  
  const buttons = card.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.disabled = loading;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = '<span class="loading"></span>';
    } else if (btn.dataset.originalText) {
      btn.textContent = btn.dataset.originalText;
    }
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
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> 処理中...';

  let successCount = 0;

  for (const ac of aircons) {
    try {
      await controlAC(token, ac.id, 'off');
      updateStatus(ac.id, false);
      successCount++;
    } catch (error) {
      console.error(`Failed to turn off ${ac.name}:`, error);
    }
  }

  btn.disabled = false;
  btn.textContent = '🔌 すべてOFF';

  if (successCount === aircons.length) {
    showToast('すべてOFFにしました');
  } else {
    showToast(`${successCount}/${aircons.length}台をOFFにしました`, 'error');
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  initTokenView();
  
  const { token, selectedAircons } = await Storage.get(['token', 'selectedAircons']);
  
  if (token && selectedAircons && selectedAircons.length > 0) {
    // 設定済み → メイン画面
    showMainView();
  } else if (token) {
    // トークンのみ設定済み → デバイス選択へ
    try {
      const appliances = await fetchAppliances(token);
      const aircons = appliances.filter(a => a.type === 'AC');
      await Storage.set({ allAircons: aircons });
      await showDeviceSelectView(aircons);
    } catch {
      UI.showOnly('token-view');
    }
  } else {
    // 未設定 → トークン入力画面
    UI.showOnly('token-view');
  }
});
