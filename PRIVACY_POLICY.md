# プライバシーポリシー — エアコン操作 - Nature Remo

最終更新日: 2025年2月20日

## はじめに

「エアコン操作 - Nature Remo」（以下「本拡張機能」）は、Nature Remo Cloud API を利用してブラウザからエアコンを操作するための Chrome 拡張機能です。本プライバシーポリシーでは、本拡張機能が取り扱うデータについて説明します。

## 収集するデータ

本拡張機能は、以下のデータをユーザーの端末内（`chrome.storage.local`）にのみ保存します。

- **Nature Remo アクセストークン** — ユーザーが手動で入力したもの
- **エアコンのデバイス情報** — Nature Remo API から取得した機器名・ID 等
- **ユーザーが選択したエアコンの一覧** — 操作対象として選んだ機器の ID と名前

## データの送信先

本拡張機能は、以下の外部サーバーとのみ通信します。

- **Nature Remo Cloud API** (`https://api.nature.global`)
  - エアコンの一覧取得および操作のために使用します
  - 送信されるデータ: アクセストークン（認証用）、操作パラメータ（モード・温度等）

上記以外のサーバーへのデータ送信は一切行いません。

## データの保存

- すべてのデータはユーザーの端末内（Chrome のローカルストレージ）にのみ保存されます
- 外部サーバーやクラウドへのデータ保存は行いません
- アクセストークンは暗号化されずに保存されます

## 第三者へのデータ提供

本拡張機能は、ユーザーのデータを第三者に提供・販売・共有しません。

## アナリティクス・トラッキング

本拡張機能は、アクセス解析ツールやトラッキングツールを一切使用しません。

## データの削除

Chrome の拡張機能管理ページから本拡張機能を削除すると、保存されたすべてのデータが自動的に削除されます。

## お問い合わせ

本プライバシーポリシーに関するご質問は、GitHub リポジトリの Issues からお願いします。

---

# Privacy Policy — AC Control - Nature Remo

Last updated: February 20, 2025

## Overview

"AC Control - Nature Remo" (the "Extension") is a Chrome extension for controlling air conditioners via the Nature Remo Cloud API.

## Data Collected

The Extension stores the following data locally on the user's device only (`chrome.storage.local`):

- **Nature Remo access token** — manually entered by the user
- **Air conditioner device information** — device names and IDs retrieved from the Nature Remo API
- **User-selected devices** — IDs and names of air conditioners chosen for control

## External Communication

The Extension communicates only with:

- **Nature Remo Cloud API** (`https://api.nature.global`)
  - Used to retrieve device lists and send control commands
  - Data sent: access token (for authentication), operation parameters (mode, temperature, etc.)

No data is sent to any other server.

## Data Storage

- All data is stored locally on the user's device only
- No data is stored on external servers or cloud services
- Access tokens are stored unencrypted

## Third-Party Data Sharing

The Extension does not sell, share, or provide user data to any third party.

## Analytics & Tracking

The Extension does not use any analytics or tracking tools.

## Data Deletion

All stored data is automatically removed when the Extension is uninstalled from Chrome.

## Contact

For questions about this privacy policy, please open an issue on the GitHub repository.
