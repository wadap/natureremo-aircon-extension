// chrome.storage.local に置くキーの単一定義。読み書きは必ずここを経由し、文字列リテラルを直書きしない。
export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'token',
  ALL_AIRCONS: 'allAircons',
  SELECTED_AIRCONS: 'selectedAircons',
  CACHED_STATUSES: 'cachedStatuses'
});

export const Storage = {
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
