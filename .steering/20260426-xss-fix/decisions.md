# Decisions: XSS 対策

## 2026-04-26: DOM API 方式を採用（escapeHtml 方式は不採用）
**決定**: `document.createElement` + `textContent` + 小さな `el()` ヘルパー で構築する。

**理由**:
- `escapeHtml()` を template literal に挟む案は差分が小さい一方、新しいフィールドを追加するたびに escape を呼び忘れる事故が起きやすい。「innerHTMLは使わない」と決め切るほうが将来的に安全。
- このリファクタは「シリーズ #1」であり、後続で popup.js を分割していく予定。DOM API 化しておけば、view 分割時にもそのまま流用できる。

## 2026-04-26: HTML 構造（クラス名・ID・data属性）は据え置き
**決定**: 既存の CSS / イベントセレクタを書き換えない。

**理由**:
- `popup.html` の CSS（550行）と、popup.js 内の `querySelectorAll('.btn')` `getElementById('status-${id}')` 等は密結合。構造を変えると影響範囲が一気に広がる。
- XSS 対策の本質は「外部由来文字列を innerHTML に流さない」こと。クラス名や属性の見直しは別タスクに分ける。
