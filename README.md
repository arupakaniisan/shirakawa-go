# shirakawa-go

複数台でのロードトリップ向け、リアルタイム車両位置共有 Web アプリ。

各車両の現在地を地図上で共有し、過去の旅行の走行履歴を振り返ることができる。
「画面を開いてボタンを押したタイミングでのみ位置情報が更新される」仕様に割り切ることで、
バックグラウンド送信や WebSocket を使わずシンプルに作る。

> 個人開発・友人間のプライベート利用を想定。直近のロードトリップで実際に使うため、
> Phase 1 を 1 週間以内に完成させることを最優先する。

---

## フェーズ別ロードマップ

| フェーズ | 期間 | デプロイ先 | DB | 主な目的 |
|---------|------|-----------|-----|---------|
| **Phase 1** | 旅行出発まで（最優先） | Vercel | なし | 旅行で実用できるアプリを完成 |
| **Phase 2** | 旅行後 | Vercel | Supabase (PostgreSQL) | 走行履歴・車両追加など機能拡張 |
| **Phase 3** | 旅行後（学習） | AWS Amplify | Amazon DynamoDB | クラウドインフラ・CI/CD・DB 移行 |

DB 層は Repository パターンで抽象化済み（`lib/db/I*Repository.ts`）。
Phase 2 → Phase 3 では実装クラスを差し替えるだけで移行できる。

詳細は [docs/requirements.md](docs/requirements.md) を参照。

---

## 技術スタック（Phase 1）

| レイヤ | 採用技術 |
|--------|----------|
| Frontend | Next.js 14 (App Router) / TypeScript / React 18 |
| 地図ライブラリ | MapLibre GL JS |
| 位置情報バックエンド | AWS Location Service v2（Tracker + API キー） |
| Hosting | Vercel (Hobby プラン) |
| 認証 | 合言葉 + HttpOnly Cookie（1 日間） |
| 状態管理 | localStorage（車両名・色のみ） |
| CI | GitHub Actions（lint + 型チェック + ビルド確認） |
| CD | GitHub Actions → Vercel CLI |

---

## ディレクトリ構成

```
/
├── app/
│   ├── auth/page.tsx                  # 合言葉入力
│   ├── api/
│   │   ├── auth/route.ts              # 認証
│   │   ├── location/
│   │   │   ├── update/route.ts        # 自車位置を AWS へ送信
│   │   │   └── fetch/route.ts         # 全車両位置を AWS から取得
│   │   └── trips/                     # Phase 2〜
│   ├── (protected)/
│   │   ├── page.tsx                   # 車両選択
│   │   ├── settings/page.tsx          # 車両名・色設定
│   │   ├── map/page.tsx               # マップダッシュボード
│   │   └── history/                   # Phase 2〜
│   └── layout.tsx
├── middleware.ts                       # 未認証 → /auth へリダイレクト
├── components/                         # MapView / VehicleMarker / StatusPanel など
├── lib/
│   ├── locationClient.ts               # AWS Location Service ラッパー
│   ├── auth.ts                         # Cookie ユーティリティ
│   ├── vehicleStorage.ts               # localStorage 読み書き
│   └── db/                             # Phase 2〜（Repository パターン）
│       ├── ITripRepository.ts
│       ├── ILocationHistoryRepository.ts
│       ├── supabase/                   # Phase 2 実装
│       └── dynamodb/                   # Phase 3 実装
├── .github/workflows/                  # ci.yml / deploy-preview.yml / deploy-production.yml
└── docs/                               # 要件定義・AWS 手順書・コスト試算
```

---

## セットアップ手順

### 前提

- Node.js 20.x / npm 10.x
- AWS アカウント（Location Service v2 を利用するため）
- Vercel アカウント（デプロイ時のみ）

### 1. リポジトリをクローンして依存をインストール

```bash
git clone https://github.com/<your-account>/shirakawa-go.git
cd shirakawa-go
npm install
```

### 2. AWS リソースを作成

[docs/aws-setup.md](docs/aws-setup.md) の STEP 1〜5 を順番に実施する。

作成するもの:
- IAM ユーザー `road-trip-app` + インラインポリシー（Tracker 操作のみ許可）
- IAM アクセスキー（サーバーサイド用）
- Location Service の API キー `road-trip-map-key`（地図タイル表示用）
- Tracker リソース `road-trip-tracker`

> リージョンは `ap-northeast-1`（東京）に固定すること。

### 3. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、以下を埋める:

| 変数 | 説明 |
|------|------|
| `PASSPHRASE` | 合言葉（メンバーで共有する文字列） |
| `AUTH_TOKEN` | Cookie 用ランダムトークン。`openssl rand -hex 32` で生成 |
| `AWS_ACCESS_KEY_ID` | STEP 3 で発行した IAM アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | STEP 3 で発行したシークレット |
| `AWS_REGION` | `ap-northeast-1` |
| `AWS_TRACKER_NAME` | `road-trip-tracker` |
| `NEXT_PUBLIC_MAP_API_KEY` | STEP 4 で発行した API キー（`v1.public.ey...`） |
| `NEXT_PUBLIC_AWS_REGION` | `ap-northeast-1` |
| `STALE_THRESHOLD_MINUTES` | 鮮度警告の閾値（分）。推奨値 `5` |

> `.env.local` は `.gitignore` 済み。**絶対に commit しないこと**。
> アクセスキーが漏洩すると不正利用で多額の請求が来るリスクがある。

### 4. ローカルで起動

```bash
npm run dev
```

→ http://localhost:3000 を開く。
→ `/auth` にリダイレクトされるので、`PASSPHRASE` で設定した合言葉を入力してログイン。

スマホ実機で確認したい場合は同一 LAN から `http://<PC の IP>:3000` で開けるが、
HTTPS でないと GPS の取得が制限されることがある。Vercel プレビュー URL での動作確認を推奨。

---

## npm スクリプト

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動（http://localhost:3000） |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番ビルドの起動 |
| `npm run lint` | ESLint 実行 |
| `npx tsc --noEmit` | 型チェックのみ実行（CI と同じ） |

---

## 開発フロー

要件定義 §5 に準拠。**`main` / `develop` への直接 push は禁止**。

```
feature/* → develop（PR + CI 通過必須）→ Vercel プレビュー自動デプロイ
develop  → main（PR）                    → Vercel 本番自動デプロイ
```

### 日常の流れ

```bash
# 1. 最新の develop から feature ブランチを切る
git switch develop && git pull origin develop
git switch -c feature/map-view

# 2. 実装してコミット
git add .
git commit -m "feat: マップ表示を実装"
git push origin feature/map-view

# 3. GitHub で feature/map-view → develop の PR を作成
#    → CI（lint + 型チェック + ビルド）が自動実行
#    → 通過したらマージ可能

# 4. マージ → develop に push されると Vercel プレビューに自動デプロイ
#    プレビュー URL でスマホ実機確認

# 5. 確認 OK → develop → main の PR を作成・マージ
#    → Vercel 本番に自動デプロイ
```

### CI で必要な GitHub Secrets

`Settings → Secrets and variables → Actions` に以下を登録:

| Secret 名 | 取得元 |
|-----------|--------|
| `VERCEL_TOKEN` | Vercel コンソール → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel link` 後に生成される `.vercel/project.json` の `orgId` |
| `VERCEL_PROJECT_ID` | 同上の `projectId` |

### ブランチ保護

`Settings → Branches` で以下を設定:

- `develop`: PR 必須 + ステータスチェック `lint-and-build` 必須
- `main`: PR 必須

---

## デプロイ（Vercel）

1. Vercel コンソールで GitHub リポジトリと連携してプロジェクトを作成
2. プロジェクトの `Settings → Environment Variables` に `.env.local` と同じ値を登録
3. `develop` push → プレビュー / `main` マージ → 本番が自動デプロイされる

---

## ドキュメント

| 文書 | 内容 |
|------|------|
| [docs/requirements.md](docs/requirements.md) | 要件定義書（v4.0）。仕様の正本 |
| [docs/aws-setup.md](docs/aws-setup.md) | AWS Location Service v2 のセットアップ手順 |
| [docs/cost-estimate.md](docs/cost-estimate.md) | コスト試算（旅行中は実質無料の見込み） |

---

## 主要な仕様メモ

- **手動更新のみ**：更新ボタンを押した瞬間にだけ自車位置を送信、全車両位置を取得する。バックグラウンド更新は行わない。
- **鮮度警告**：最終更新から `STALE_THRESHOLD_MINUTES`（既定 5 分）を超えたらマーカーをグレーアウトし、警告アイコンを出す。
- **オフライン**：`navigator.onLine = false` の場合は直前の表示を維持し、トーストで通知する。
- **車両 ID は連番**：`vehicle-001`, `vehicle-002`, ...（AWS Location Service のトラッキングキー）。
- **車両名・色は端末ローカル**：localStorage に保存。Phase 2 で DB 同期を検討。

---

## ライセンス

個人開発・非商用プライベートプロジェクト。ライセンスは未設定。
