# エアコンスイッチャー for Nature Remo（Chrome拡張）

Nature Remo Cloud API を使って、ブラウザのツールバーからエアコンを素早く操作するための Chrome 拡張です。

- 初回セットアップ：アクセストークン入力 → 操作したいエアコンを選択
- 日常操作：各エアコンの ON/OFF、まとめて OFF
- 詳細：モード（冷房/暖房/除湿/送風/自動）と温度を表示し、詳細画面から変更可能

---

## インストール（開発版 / Load unpacked）

1. このリポジトリを取得
2. Chrome で `chrome://extensions` を開く
3. 右上の **「デベロッパーモード」** を ON
4. **「パッケージ化されていない拡張機能を読み込む」** をクリック
5. このフォルダ（`aircon-extension-v2-with-docs`）を選択

---

## セットアップ（トークン発行 → デバイス選択）

1. 拡張機能アイコンをクリックしてポップアップを開く
2. **Nature Remo アクセストークン** を入力
   - トークン発行：<https://home.nature.global/>
3. 接続に成功するとエアコン一覧が出るので、操作したいエアコンにチェック
4. **「選択したエアコンを保存」**

以降は選択したエアコンだけがメイン画面に表示されます。

---

## 使い方

### メイン画面
- 各エアコンカード
  - ON/OFF ボタン
  - 現在の **モード名** と **温度** を表示
  - 右側の `›`（詳細）からドリルダウンできる UI

### 詳細画面（ドリルダウン）
- 運転モード：自動 / 冷房 / 暖房 / 除湿 / 送風
- 温度：数値入力（例: 24）
- **「適用」** で反映（成功後、メイン画面に戻って状態を再取得）

### すべてOFF
- 表示中のエアコンを一括で OFF

### 設定変更
- **「⚙️ 設定を変更」** から、エアコンの選択をやり直せます

---

## 技術メモ

- Manifest V3（Service Worker なしの popup 完結）
- ストレージ：`chrome.storage.local`
  - `token`：Nature Remo アクセストークン
  - `allAircons`：取得したエアコン情報（再選択用）
  - `selectedAircons`：選択したエアコン（id/name）

---

## 使用 API

Base URL：`https://api.nature.global/1`

- デバイス一覧：`GET /appliances`
- 操作/設定：`POST /appliances/{appliance_id}/aircon_settings`
  - ON：`button=`
  - OFF：`button=power-off`
  - モード/温度変更：`operation_mode` / `temperature`（フォーム形式）

API ドキュメント：<https://developer.nature.global/> / <https://swagger.nature.global/>

---

## セキュリティ/注意事項

- トークンは `chrome.storage.local` に保存されます（暗号化はされません）。
- Nature Remo API は **5分で30回** を超えると 429（Rate limit）になることがあります。短時間の連打には注意してください。

---

## ライセンス

必要なら追記してください。
