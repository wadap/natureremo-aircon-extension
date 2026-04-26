# Tasklist: XSS 対策

- [x] requirements.md を作成
- [x] design.md / decisions.md を作成
- [x] `el()` ヘルパーを popup.js 上部に追加
- [x] `showDeviceSelectView` を DOM API ベースに書き換え (popup.js:162-182)
- [x] `renderAirconList` を DOM API ベースに書き換え (popup.js:477-526)
- [x] 既存セレクタ (`#status-${id}`, `#subtitle-${id}`, `.btn[data-id][data-action]`, `.room-card`) が壊れていないことを目視確認
- [x] `node --check` で構文OK
- [ ] Chrome で拡張を再ロードして手動動作確認 ← ユーザー側で確認
- [ ] 可能ならリモコン名にHTML文字を入れてエスケープを目視確認 ← ユーザー側で確認
