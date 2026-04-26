# Design: XSS 対策

## 方針
`innerHTML + template literal` を捨て、`document.createElement` ベースの DOM 構築に置き換える。`textContent` と `setAttribute` を使うため、外部由来文字列は本質的に HTML として解釈されない。

## 検討した選択肢

| 案 | 利点 | 欠点 | 採否 |
|---|---|---|---|
| A. DOM API (createElement / textContent) | デフォルトで安全。innerHTML を排除でき防御が多層化 | 既存より行数が増える | ✅ 採用 |
| B. `escapeHtml()` ヘルパーを innerHTML 内で使う | 差分最小 | 新フィールド追加時に escape し忘れやすい。innerHTML 残存 | ❌ |
| C. `<template>` タグ + clone + textContent | HTML側に構造が残る | popup.html に template を増やす必要 | ❌ |
| D. タグ付きテンプレートで自動エスケープ | モダン | 自前実装の維持コスト | ❌ |

A を採用。コードベースが小さくテンプレートの再利用もないため、DOM API + 小さなヘルパーで十分。

## ヘルパーの追加
template literal の HTML を毎回 createElement に展開すると冗長になるため、`el()` を `popup.js` 上部に追加する。

```js
function el(tag, props = {}, children = []) {
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
```

`text` プロパティで textContent を、`dataset` で data属性をまとめて指定可能。`role`/`tabindex`/`aria-*` のような属性は `setAttribute` 側に流れる。

## リスク・影響範囲

### 機能面
- HTML 構造（クラス名、ID、data属性、aria属性）は完全に保つ → 既存 CSS/イベントセレクタ (`.btn`, `.room-card`, `[data-id]`, `#status-${id}`, `#subtitle-${id}`) を壊さないこと。
- `acList.querySelectorAll('.btn')` 等の後段ロジックは旧コードと同じ querySelector を使うため、構造一致が必須。

### 振る舞い
- `deviceList.innerHTML = aircons.map(...)` は今まで「全置換」だった。新コードでも `replaceChildren()` で全置換にする → 重複描画なし。
- `acList` も同様。

### パフォーマンス
- 描画件数は数台規模なのでDOM API化による差は無視できる。

## テスト戦略
ユニットテスト基盤がないため、手動検証で確認する。
1. Chrome 拡張を再ロード → トークン入力 → デバイス選択 → メイン画面 → 詳細画面まで一通りクリックで遷移できる。
2. ON / OFF ボタン、すべてOFF ボタンが従来通り動く。
3. （可能なら）Nature Remo アプリでリモコン名に `<b>x</b>` のような文字列を一時的に設定し、リテラルとして表示されることを目視確認。
