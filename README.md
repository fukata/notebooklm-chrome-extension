# NotebookLM Chrome Extension

NotebookLMのソース管理を効率化するChrome拡張機能です。

[Screencast from 2025-04-15 19-56-43.webm](https://github.com/user-attachments/assets/c4e5d7e1-bccc-45dc-a445-e3c10bb9c6c5)

## 機能

- 複数のソースを一括で削除する機能
- チェックボックスによるソースの選択
- 削除前の確認ダイアログ
- 安全な削除処理（1件ずつ順次処理）

## インストール方法

1. Chromeブラウザで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このプロジェクトのディレクトリを選択

## 使用方法

1. NotebookLMのソース一覧ページ（`https://notebooklm.google.com/notebook/*`）を開く
2. 削除したいソースのチェックボックスを選択
3. 「削除」ボタンをクリック
4. 確認ダイアログで「OK」をクリック

## 注意事項

- 一度に大量のソースを削除する場合は、処理に時間がかかる場合があります
- 削除操作は取り消せません
- 削除前に必ず確認ダイアログが表示されます

## 開発

- `manifest.json`: 拡張機能の設定
- `content.js`: コンテンツスクリプト（メインの機能実装）

## セキュリティ

- コンテンツセキュリティポリシー（CSP）を適切に設定
- 必要な権限のみを要求（activeTab, storage） 
