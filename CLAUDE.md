# CLAUDE.md

## 作業記録（Steering Docs）

まとまった作業を行う際は、`.steering/[YYYYMMDD]-[タスク名]/` ディレクトリに以下のファイルを作成・更新して作業内容を記録すること。これにより、後続のセッションでコンテキストを引き継げるようにする。

```
.steering/[YYYYMMDD]-[タスク名]/
├── requirements.md  # 作業の要求内容・スコープ
├── design.md        # 設計方針・リスク・影響範囲
├── tasklist.md      # 実装タスク（チェックリスト形式）
├── blockers.md      # ブロッカー・要確認事項
└── decisions.md     # 重要な決定事項とその理由
```

- タスク完了時は `tasklist.md` のチェックボックスを更新する
- 重要な判断を下した場合は `decisions.md` に記録する
- 軽微な修正（1ファイルの小さな変更など）には不要
