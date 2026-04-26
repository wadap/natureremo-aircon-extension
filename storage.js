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
