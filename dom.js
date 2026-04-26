// DOM要素ビルダー: 外部由来文字列をHTMLとして解釈させないため、
// 文字列はすべて textContent / setAttribute 経由で入る。
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child != null && child !== false) node.append(child);
  }
  return node;
}

export const UI = {
  show(id) {
    document.getElementById(id).classList.remove('hidden');
  },
  hide(id) {
    document.getElementById(id).classList.add('hidden');
  },
  showOnly(id) {
    ['loading-view', 'token-view', 'device-select-view', 'main-view', 'detail-view'].forEach(viewId => {
      if (viewId === id) this.show(viewId);
      else this.hide(viewId);
    });
  }
};

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// 非同期処理中はボタンを disabled + spinner、完了したら元のラベルに戻す。
// buttons は単一要素 / NodeList / 配列のいずれも受け付ける。
export async function withLoading(buttons, loadingHTML, fn) {
  const arr = buttons instanceof Element ? [buttons] : [...buttons];
  const originals = arr.map(b => b.textContent);
  arr.forEach(b => {
    b.disabled = true;
    b.innerHTML = loadingHTML;
  });
  try {
    return await fn();
  } finally {
    arr.forEach((b, i) => {
      b.disabled = false;
      b.textContent = originals[i];
    });
  }
}
