# Requirements: XSS 対策

## 背景
リファクタリング項目 #1。`popup.js` 内で Nature Remo API から取得した文字列（`ac.nickname`、`ac.model.manufacturer`、`ac.model.name`）を `innerHTML` の template literal にエスケープせず埋め込んでいる。

ユーザーがリモコン名に HTML/JS を含めた場合（例: `<img src=x onerror=alert(1)>`）、ポップアップ内でスクリプトが実行されるリスクがある。

## スコープ
**対象**: `popup.js` の以下2箇所の `innerHTML` 構築。

1. `showDeviceSelectView` (popup.js:150-158) — デバイス選択画面
2. `renderAirconList` (popup.js:454-482) — メイン操作画面のAC一覧

**対象外**:
- 静的文字列のみの `innerHTML`（例: ローディングスピナー）
- 既に `textContent` を使っている箇所

## 受け入れ基準
- 上記2関数で外部由来の文字列が HTML として解釈されない
- 既存の見た目・挙動が崩れない（クラス名、data属性、aria属性、ID命名、イベントハンドラ動作）
- `aria-label` のように属性値に名前を含む箇所も安全に設定される
