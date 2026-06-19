# Design: popup 起動の体感高速化（stale-while-revalidate）

- **Date**: 2026-06-19
- **Related**: requirements.md

## 方針概要
変更を `popup.js`（オーケストレーション）+ 新規純モジュール + `popup.css`（インジケータ）に閉じる。状態を `chrome.storage.local` にキャッシュして即描画し、API はバックグラウンドで叩いて差し替える。

## データモデル
- 新キャッシュキー `cachedStatuses`:
  ```
  { "<applianceId>": { isOn, mode, temp, tempUnit, rangeModes }, "_ts": <epochMs> }
  ```
  - `rangeModes` を含めることで、更新前に詳細画面を開いても温度範囲が正しい
- 既存 `selectedAircons`（id+name）はそのまま利用

## 既存パターン delta
- 現状 `showMainView` 内にインラインの「appliances → statuses マップ生成」ロジックがある（`popup.js:117-134` 付近）
- これを純関数 **`extractStatuses(appliances, selectedAircons)` → statusMap** として新モジュール `status.js` に抽出。既存 `modes.js` / `detail-temp.js` と同じ「純ロジックは別ファイル + node:test」方針に揃える
- キャッシュ I/O は既存 `Storage` 経由

## 起動フロー（`showMainView` 改修）
1. `Storage.get(['token','selectedAircons','cachedStatuses'])`
2. token/selectedAircons 不足 → 従来どおり token-view へ
3. `cachedStatuses` があれば即 `renderAirconList(selectedAircons, cached, token)` + 更新インジケータ ON
4. なければ従来のローディング表示
5. バックグラウンドで `fetchAppliances(token)`:
   - 成功: `extractStatuses()` で新 statusMap 生成 → `cachedStatuses` 保存（`_ts` 更新）→ `renderAirconList` で再描画 → インジケータ OFF
   - 失敗: キャッシュ表示を維持、インジケータ OFF、`showToast('最新の状態を取得できませんでした', 'error')`、`console.error`
6. ON/OFF 操作後は楽観的に `updateStatus` 済み（既存）。操作結果は次回 fetch で確定。操作成功時に該当 id の `cachedStatuses` も更新しておく（軽微・任意）

## インジケータ
- `popup.html` の `<h1 id="...">` 付近に更新スピナー用の小要素を置く（または JS で append/remove）。class 名保持方針のため JS で `h1` に小スピナー span を append/remove する方式を採る
- `popup.css` に `.title-spinner`（既存 `.loading` を流用、12px 程度）を追加。アクセント色

## リスク・影響範囲
- 影響: `popup.js`、新規 `status.js`、`popup.css`（軽微）、テスト追加。`api.js`/`storage.js`/`dom.js` は不変
- ステータスが一時的に古い可能性 → ~1秒で最新化。リモコン用途では許容
- キャッシュと実機状態の乖離（アプリ側で操作された場合）も次回 fetch で解消
- 再描画はカード数個で安価。再描画でイベント再バインドされるが既存と同じ経路

## テスト戦略
- **新規ユニットテスト**（node:test、既存43件と同枠）: `status.js` の `extractStatuses()`
  - settings 有り → isOn/mode/temp/tempUnit/rangeModes が正しく入る
  - `button==='power-off'` → isOn=false
  - appliance が見つからない選択 id → その id はマップに含めない（or 未定義）
  - settings 無し appliance → 含めない
- 手動/Playwright 目視: キャッシュ即表示 → 更新差し替え、初回ローディング、更新失敗時のトースト
- 回帰: `npm test` 全件 pass

## 段取り
1. `status.js` 抽出 + テスト（TDD: テスト先行）
2. `showMainView` をキャッシュ即表示 + 背景更新に改修
3. インジケータ（css + js）
4. `npm test` + Playwright 目視
