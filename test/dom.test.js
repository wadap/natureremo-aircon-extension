import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { showToast, TOAST_DURATION_MS } from '../dom.js';

// showToast が触る最小限の DOM だけを持つ偽の #toast。
function fakeToast() {
  const classes = new Set();
  return {
    textContent: '',
    set className(value) {
      classes.clear();
      value.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    get className() {
      return [...classes].join(' ');
    },
    classList: {
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c)
    }
  };
}

describe('showToast', () => {
  let toast;

  beforeEach(() => {
    toast = fakeToast();
    globalThis.document = { getElementById: () => toast };
    mock.timers.enable({ apis: ['setTimeout'] });
  });

  afterEach(() => {
    // dom.js は直前のタイマーを module 変数に持つ。未発火のまま reset すると、
    // 次のテストの clearTimeout がその古いハンドルを掴んで mock timer のキューを壊すので、先に流し切る。
    mock.timers.runAll();
    mock.timers.reset();
    delete globalThis.document;
  });

  it('shows the message and hides it after TOAST_DURATION_MS', () => {
    showToast('保存しました');
    assert.equal(toast.textContent, '保存しました');
    assert.equal(toast.className, 'toast success show');

    mock.timers.tick(TOAST_DURATION_MS - 1);
    assert.equal(toast.classList.contains('show'), true);
    mock.timers.tick(1);
    assert.equal(toast.classList.contains('show'), false);
  });

  it('applies the given type as a class', () => {
    showToast('失敗', 'error');
    assert.equal(toast.className, 'toast error show');
  });

  it('keeps a newer toast visible for its full duration', () => {
    showToast('1 つ目');
    mock.timers.tick(TOAST_DURATION_MS - 500);
    showToast('2 つ目');

    // 1 つ目のタイマーが切れる時刻。2 つ目はまだ表示中でなければならない。
    mock.timers.tick(500);
    assert.equal(toast.classList.contains('show'), true);
    assert.equal(toast.textContent, '2 つ目');

    mock.timers.tick(TOAST_DURATION_MS - 500);
    assert.equal(toast.classList.contains('show'), false);
  });
});
