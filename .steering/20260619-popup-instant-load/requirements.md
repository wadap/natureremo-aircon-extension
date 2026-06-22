# Requirements: popup 起動の体感高速化

- **Date**: 2026-06-19
- **Branch**: `feature/ui-refresh`（UI 改善と同ブランチで継続。必要なら分割可）

## 背景・動機
Chrome のアイコンを押してからエアコン一覧が出るまで ~1秒のラグがある。原因は起動時に毎回 Nature Remo クラウド API (`fetchAppliances`) を叩き、その往復応答を待ってからカードを描画しているため（`popup.js` の `showMainView`）。リモコン用途なので即時操作したく、このラグを消したい。

## スコープ
- **stale-while-revalidate**: 前回の状態を `chrome.storage.local` にキャッシュし、popup を開いた瞬間にキャッシュからカード描画 → 裏で API 更新 → 応答で差し替え
- 更新中は**控えめなインジケータ**（タイトル横の小スピナー）を表示し、完了で消す
- 初回（キャッシュ無し）のみ従来どおりローディング表示
- 純ロジック（appliances→statuses 変換）を別モジュールに抽出してユニットテスト追加

## 非スコープ（YAGNI）
- 定期プリフェッチ（chrome.alarms）・background service worker
- `alarms` 等の新規 permission 追加
- API 自体の高速化（不可）

## 成功基準
- 2回目以降の popup 起動で、カードが**体感即時**（API 待ちなし）で表示される
- API 応答後にステータスが正しく最新へ更新される
- 更新失敗時もキャッシュ表示が消えず、操作可能なまま
- 既存ユニットテストが pass、抽出した純関数に新規テスト追加

## 制約
- Manifest V3 / ビルドツール無し / 素の HTML/CSS/JS
- XSS 対策の `el()` ビルダー経由の DOM 生成を維持
- `Storage`（chrome.storage.local ラッパ）経由で読み書き
