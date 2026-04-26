# Blockers / 要確認事項

現時点でブロッカーなし。

## 要確認（実装後）
- `acList.querySelectorAll('.btn')` のセレクタが `.mode-btn` と衝突しないか確認（メイン画面では `.btn-on/.btn-off` のみで、`.mode-btn` は detail-view のため、衝突しない見込み）。
- `setButtonsLoading` が `card.querySelectorAll('.btn')` を使っており、AC一覧のカード内に他の `.btn` が増えないことを前提としている。
