const API_BASE = 'https://api.nature.global/1';

export async function fetchAppliances(token) {
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

export async function setAirconSettings(token, applianceId, params) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    body.set(k, String(v));
  });
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

export async function controlAC(token, applianceId, action) {
  const params = action === 'on' ? { button: '' } : { button: 'power-off' };
  return setAirconSettings(token, applianceId, params);
}
