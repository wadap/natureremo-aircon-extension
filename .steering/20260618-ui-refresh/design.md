# Design: UI リフレッシュ(テーマ基盤 + 緑アクセント + 両対応)

- **Date**: 2026-06-18
- **Related**: requirements.md

## 方針概要
変更を `popup.css` にほぼ閉じ込める。全色をハードコードから CSS カスタムプロパティ(変数)へ移行し、`:root`(ダーク既定)と `@media (prefers-color-scheme: light)`(ライト上書き)の 2 セットで両対応する。HTML/JS の class 名は変えない。

## 既存パターン delta
- 現状: `popup.css` 内に `#1a1a2e` / `#ff7043` 等の hex・グラデが約 20 箇所に散在。`.btn-on` `.mode-btn.active` `.btn-primary` `.status.on` などが個別に色指定。
- delta: これらを変数参照に置換し、定義を上部の `:root` に集約。値だけをテーマで切り替える。構造セレクタ(レイアウト系)は触らない。

## トークン設計(`:root`)
| トークン | 役割 | ダーク | ライト |
|---|---|---|---|
| `--bg` | body 背景(グラデ可) | ネイビーグラデ維持 | `#f4f6f7` 系 |
| `--surface` | カード/入力背景 | `rgba(255,255,255,.08)` | `#ffffff` |
| `--surface-hover` | hover 背景 | `rgba(255,255,255,.12)` | `#f0f3f3` |
| `--border` | 枠線 | `rgba(255,255,255,.1〜.2)` | `rgba(0,0,0,.08)` |
| `--text` | 主要文字 | `#fff`/`#e0e0e0` | `#16302d` |
| `--text-muted` | 副次文字 | `rgba(255,255,255,.55)` | `rgba(0,0,0,.55)` |
| `--text-subtle` | 最も淡い文字 | `rgba(255,255,255,.4)` | `rgba(0,0,0,.4)` |
| `--accent` / `--accent-2` | アクセント(グラデ起点/終点) | `#1FB6A6` / `#0E9B86` | 同左(共通) |
| `--accent-contrast` | アクセント上の文字 | `#fff` | `#fff` |
| `--on-bg` / `--on-fg` | ON ステータスpill | 緑系 | 緑系 |
| `--off-bg` / `--off-fg` | OFF ステータスpill | グレー系 | グレー系 |
| `--danger` / `--danger-2` | 全 OFF・エラー | 赤系維持 | 赤系維持 |
| `--radius` / `--radius-lg` | 角丸 | 8px / 12px | 同左 |
| `--shadow` | カードの影(浮き感) | 薄い暗影 | 薄いグレー影 |

※ アクセントの具体 hex は実装後にスクリーンショットで微調整可。

## レイアウト磨き(構造不変)
- **タイポスケール整理**: 現状 0.7〜1.6rem がばらつく → 役割ベースに 5 段階程度へ整理(見出し/本文/ラベル/キャプション/数値大)。値の置換のみで HTML 不変。
- **ルームカード(Option A)**: 並びは現行維持。`--surface` / `--border` / `--shadow` 適用、hover の浮き(`translateY`)と影遷移を整理。status pill とドリルダウン矢印をトークン化。
- **詳細画面**: モードボタングリッドの gap と温度ステッパー周りの余白を統一。`.mode-btn.active` と `.btn-primary` をアクセントグラデに。
- **toast / focus-visible / loading spinner / error-message**: すべてトークン参照に。

## リスク・影響範囲
- 影響は `popup.css` のみ(必要なら `popup.html` の微調整も class 名保持の範囲で)。`popup.js` / `*.js` は触らない。
- ライトテーマで `select option` の OS テーマ追従問題(既存コメント参照, popup.css:60)が再燃しうる → ライト側でも option の bg/色を明示する。
- `parseFloat` NaN ガード等のロジックには無関係。

## テスト戦略
- 既存ユニットテスト(`node:test`, 43 件)は純ロジック対象。CSS 変更で壊れない想定 → `npm test` で緑維持を確認(回帰検出のため実装後に必ず実行)。
- 視覚確認: `popup.html` を 340px 幅でブラウザ表示し、ライト/ダーク両方でスクリーンショット。各画面(token / device-select / main / detail)を目視。
  - ダーク/ライトの切替は OS 設定 or DevTools の `prefers-color-scheme` エミュレーションで確認。
- アクセシビリティ: 主要文字色と背景のコントラスト比が両テーマで WCAG AA(4.5:1)目安を満たすか確認。

## 段取り(実装計画は writing-plans で詳細化)
1. CSS 変数を `:root` に定義(ダーク = 現行値の写し)。まず無改色で変数化し回帰ゼロを確認。
2. アクセントを緑/ティールへ差し替え。
3. `@media (prefers-color-scheme: light)` でライト上書き追加。
4. タイポスケール・余白・影の微調整。
5. 視覚確認(両テーマ・全画面) + `npm test`。
