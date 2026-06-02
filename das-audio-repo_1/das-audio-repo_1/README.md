# DAS Audio Japan — 特設サイト

DAS Audio 日本総代理店（脇本商会 / Soundassist）特設サイト。静的サイト（ビルド不要）。

## 構成
- `index.html` … 本体
- `assets/das-55-intro.mp4` … 入場ムービー
- `images/` … ロゴ・背景画像
- `netlify.toml` … Netlify設定（publish = ルート）

## 公開前に差し替え（index.html 内）
- `const ORDER_EMAIL = "..."` … 見積メール受信アドレス
- フッターの `REPLACE_電話番号` / `REPLACE_メールアドレス`

## GitHub へ上げる（コマンドの例）
    git init
    git add .
    git commit -m "Initial: DAS Audio Japan site"
    git branch -M main
    git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
    git push -u origin main

## Netlify と連携（既存プロジェクトに紐付け＝独自ドメイン維持）
1. Netlify → 対象プロジェクト（dasaudio-japan）→ プロジェクト構成 → Build & deploy → Continuous deployment
2. 「Link repository」→ GitHub を認可 → このリポジトリを選択
3. Branch: `main` ／ Build command: （空欄） ／ Publish directory: `.`
4. 保存。以後 `main` に push するたび自動デプロイ。独自ドメイン（das.wakimotocorp.com）はそのまま。
