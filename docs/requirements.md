# 要件定義書 — 複数車両リアルタイム位置共有 Web アプリ

> Version 4.0 / ヒアリング完了版

---

## 1. プロジェクト概要

複数台でのロードトリップにおいて、各車両の現在地をリアルタイムに地図上で共有し、
過去の旅行の走行履歴を振り返ることができる Web アプリケーション。

**設計方針:**
- 「画面を開いてボタンを押したタイミングでのみ位置情報が更新・同期される」仕様に割り切る
- データの鮮度（最終更新時刻）を視覚的に明示し、メンバー間の認識のズレを防ぐ
- **直近のロードトリップで実際に使うため、Phase 1 を 1 週間以内に完成させることを最優先する**
- **DB 層を抽象化し、Supabase → DynamoDB の移行コストを最小化する**

---

## 2. プロジェクト前提

| 項目 | 内容 |
|------|------|
| 開発体制 | 個人開発（1名） |
| 利用シーン | 直近のロードトリップ（1週間以内に出発） |
| 同時利用車両数 | 今回 2 台、将来的に増やせる設計 |
| 対応デバイス | スマートフォン（メイン）/ PC（閲覧可能） |
| 認証方式 | 合言葉（パスフレーズ）1 つのみ |
| ドメイン | 不要（Vercel デフォルト URL を使用） |
| AWS 経験 | Location Service v2 の使用経験あり |

---

## 3. フェーズ別計画

| フェーズ | 期間 | デプロイ先 | DB | 主な目的 |
|---------|------|-----------|-----|---------|
| **Phase 1** | 〜旅行出発まで（最優先） | Vercel | なし | 旅行で実用できるアプリを完成 |
| **Phase 2** | 旅行後 | Vercel | **Supabase** | 走行履歴・車両追加など機能拡張 |
| **Phase 3** | 旅行後（学習） | **AWS Amplify** | **DynamoDB** | クラウドインフラ・CI/CD・DB 移行 |

### フェーズ移行の考え方

```
Phase 1  位置共有のみ（DB なし・シンプル）
  ↓ 旅行後
Phase 2  履歴機能を Supabase で実装（速く動くものを作る）
  ↓ 移行コスト最小化のため DB 層を抽象化しておく
Phase 3  デプロイを AWS Amplify へ移行 + DB を DynamoDB へ置き換え
```

> ⚠️ **Phase 3 の移行は旅行後に実施。** インフラ移行を旅行前に含めると間に合わないリスクが高いため。

---

## 4. 技術スタック

### Phase 1（旅行前）

| 項目 | 採用技術 |
|------|----------|
| Frontend | Next.js (App Router) / TypeScript |
| 地図ライブラリ | MapLibre GL JS |
| 位置情報バックエンド | AWS Location Service v2 |
| Hosting | Vercel (Hobby プラン) |
| DB | なし |
| 認証 | 合言葉 + Cookie |
| 状態管理 | localStorage（車両設定） |

### Phase 2（旅行後・履歴機能追加）

| 項目 | 採用技術 | 変更点 |
|------|----------|--------|
| DB | **Supabase (PostgreSQL)** | 新規追加 |
| その他 | Phase 1 と同じ | 変更なし |

### Phase 3（旅行後・インフラ移行）

| 項目 | 採用技術 | 変更点 |
|------|----------|--------|
| Hosting | **AWS Amplify** | Vercel から移行 |
| CI/CD | **AWS Amplify CI/CD** | 新規追加 |
| DB | **Amazon DynamoDB** | Supabase から移行 |
| その他 | Phase 2 と同じ | 変更なし |

---

## 5. CI/CD 設計（GitHub Actions + Vercel）

Phase 1 から整備し、Phase 3 の AWS Amplify 移行後も考え方をそのまま活かす。

### 5-1. ブランチ戦略

```
main
 └─ 本番環境（Vercel production）
      ↑ develop からの PR マージのみ（直接 push 禁止）

develop
 └─ ステージング相当（Vercel preview）
      ↑ feature/* からの PR マージで更新

feature/*
 └─ 機能開発ブランチ（例: feature/auth, feature/map-view）
      ↑ develop への PR を作成してマージ
```

**運用ルール:**
- `feature/*` → `develop` への PR 作成時に **CI（lint + 型チェック + ビルド確認）が自動実行**
- CI が通らない限りマージ不可（GitHub ブランチ保護ルールで強制）
- `develop` → `main` へのマージで **Vercel 本番への自動デプロイが実行**
- `main` / `develop` への直接 push は禁止

### 5-2. GitHub Actions ワークフロー設計

#### ワークフロー一覧

| ファイル名 | トリガー | 内容 |
|-----------|---------|------|
| `ci.yml` | `feature/*` → `develop` への PR | lint + 型チェック + ビルド確認 |
| `deploy-preview.yml` | `develop` への push | Vercel プレビューへ自動デプロイ |
| `deploy-production.yml` | `main` への push | Vercel 本番へ自動デプロイ |

#### ci.yml（PR 時の自動チェック）

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches:
      - develop

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          # ビルド時に必要な環境変数（ダミー値で OK）
          PASSPHRASE: dummy
          AUTH_TOKEN: dummy
          AWS_ACCESS_KEY_ID: dummy
          AWS_SECRET_ACCESS_KEY: dummy
          AWS_REGION: ap-northeast-1
          AWS_TRACKER_NAME: dummy
          AWS_MAP_NAME: dummy
          STALE_THRESHOLD_MINUTES: 5
```

#### deploy-preview.yml（develop push 時）

```yaml
# .github/workflows/deploy-preview.yml
name: Deploy Preview

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Preview)
        run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### deploy-production.yml（main push 時）

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel (Production)
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 5-3. GitHub Secrets の設定

GitHub リポジトリの Settings → Secrets and variables → Actions に以下を登録する。

| Secret 名 | 取得元 |
|-----------|--------|
| `VERCEL_TOKEN` | Vercel コンソール → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel link` 実行後に生成される `.vercel/project.json` の `orgId` |
| `VERCEL_PROJECT_ID` | 同上の `projectId` |

### 5-4. GitHub ブランチ保護ルール

GitHub リポジトリの Settings → Branches から以下を設定する。

**`develop` ブランチ:**
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - 必須チェック: `lint-and-build`（ci.yml のジョブ名と一致させる）
- ✅ Do not allow bypassing the above settings

**`main` ブランチ:**
- ✅ Require a pull request before merging
- ✅ Do not allow bypassing the above settings

### 5-5. 日常の開発フロー

```
1. develop から feature ブランチを切る
   $ git switch develop && git pull origin develop
   $ git switch -c feature/map-view

2. 実装・コミット・push
   $ git add . && git commit -m "feat: マップ表示を実装"
   $ git push origin feature/map-view

3. GitHub で feature/map-view → develop への PR を作成
   └─ CI（lint + 型チェック + ビルド）が自動実行
       ✅ 通過 → マージ可能
       ❌ 失敗 → 修正して再 push → CI 再実行

4. PR マージ → develop に push
   └─ deploy-preview.yml が起動 → Vercel プレビューに自動デプロイ
   └─ プレビュー URL でスマホ実機確認

5. 確認 OK → develop → main への PR を作成してマージ
   └─ deploy-production.yml が起動 → Vercel 本番に自動デプロイ
```

### 5-6. Phase 3 移行時の変更点（AWS Amplify への切り替え）

CI（lint + ビルド確認）は GitHub Actions のまま継続し、CD のみ Amplify へ切り替える。

| | Phase 1〜2 | Phase 3 |
|--|-----------|---------|
| CI | GitHub Actions | GitHub Actions（**変更なし**） |
| CD | GitHub Actions → Vercel CLI | AWS Amplify CI/CD（`amplify.yml`） |
| プレビュー | Vercel プレビュー URL | Amplify ブランチプレビュー |

```
Phase 3 の移行手順:
1. amplify.yml をプロジェクトルートに追加
2. Amplify コンソールで GitHub リポジトリと連携（main / develop を登録）
3. deploy-preview.yml / deploy-production.yml を削除
4. GitHub Secrets から VERCEL_* を削除
5. 動作確認後 Vercel プロジェクトを削除
```

---

## 6. システム全体構成

### Phase 1

```
ブラウザ（スマホ）
  └─ Next.js + MapLibre GL JS
        │
        ▼
     Vercel
  ├─ Route Handler /api/auth        合言葉照合 + Cookie 付与
  ├─ Route Handler /api/location/update   自車位置を AWS へ送信
  └─ Route Handler /api/location/fetch    全車両位置を AWS から取得
        │
        ▼
  AWS Location Service v2
  ├─ Map（地図タイル配信）
  └─ Tracker（車両位置管理）
```

### Phase 2（DB 追加）

```
ブラウザ（スマホ）
  └─ Next.js + MapLibre GL JS
        │
        ▼
     Vercel
  ├─ Route Handler /api/trips/*     旅行・履歴の CRUD
  ├─ Route Handler /api/location/*  位置情報の送受信（変更なし）
  └─ DB 抽象化層（ILocationHistoryRepository）
        │                 │
        ▼                 ▼
  AWS Location        Supabase
  Service v2          (PostgreSQL)
```

### Phase 3（インフラ移行）

```
GitHub
  └─ push (main)
        │ webhook
        ▼
  AWS Amplify CI/CD
  └─ ビルド → デプロイ
        │
        ▼
  AWS Amplify Hosting
  └─ Next.js SSR
        │
        ├─ AWS Location Service v2（変更なし）
        └─ Amazon DynamoDB（Supabase から移行）
```

---

## 7. DB 設計

### 6-1. DB 抽象化層の設計方針

Supabase → DynamoDB の移行コストを最小化するため、
**Repository パターン** で DB アクセスを抽象化する。

```typescript
// インターフェース（変更しない）
interface ITripRepository {
  createTrip(trip: Trip): Promise<Trip>;
  getTripById(id: string): Promise<Trip | null>;
  listTrips(): Promise<Trip[]>;
  updateTrip(id: string, data: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
}

interface ILocationHistoryRepository {
  savePosition(tripId: string, position: LocationPoint): Promise<void>;
  getPositionsByTrip(tripId: string): Promise<LocationPoint[]>;
  getPositionsByVehicle(tripId: string, vehicleId: string): Promise<LocationPoint[]>;
}

// Phase 2: Supabase 実装
class SupabaseTripRepository implements ITripRepository { ... }

// Phase 3: DynamoDB 実装（インターフェースは同じ）
class DynamoDBTripRepository implements ITripRepository { ... }
```

移行時は **実装クラスを差し替えるだけ**で済む。

### 6-2. データモデル

#### Trip（旅行）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string (UUID) | 旅行 ID |
| `name` | string | 旅行名（例: 「白川郷旅行」） |
| `startedAt` | timestamp | 旅行開始日時 |
| `endedAt` | timestamp \| null | 旅行終了日時（進行中は null） |
| `createdAt` | timestamp | 作成日時 |

#### LocationPoint（位置情報ログ）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string (UUID) | レコード ID |
| `tripId` | string | 旅行 ID（Trip への参照） |
| `vehicleId` | string | 車両 ID（例: `vehicle-001`） |
| `latitude` | number | 緯度 |
| `longitude` | number | 経度 |
| `recordedAt` | timestamp | AWS Location Service の受信時刻 |

> 📝 LocationPoint は更新ボタンを押すたびに追記される。1 回の押下 = 1 レコード。

### 6-3. Supabase テーブル定義（Phase 2）

```sql
-- 旅行テーブル
CREATE TABLE trips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 位置情報ログテーブル
CREATE TABLE location_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vehicle_id  TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス（旅行・車両ごとの取得を高速化）
CREATE INDEX idx_location_points_trip_id ON location_points(trip_id);
CREATE INDEX idx_location_points_vehicle ON location_points(trip_id, vehicle_id);
```

### 6-4. DynamoDB テーブル設計（Phase 3）

```
テーブル名: road-trip

パーティションキー: PK (String)
ソートキー:        SK (String)

-- Trip レコード
PK: "TRIP#{tripId}"
SK: "METADATA"
属性: name, startedAt, endedAt, createdAt

-- LocationPoint レコード
PK: "TRIP#{tripId}"
SK: "LOC#{vehicleId}#{recordedAt(ISO8601)}"
属性: latitude, longitude, vehicleId, recordedAt

-- GSI（車両ごとの軌跡取得）
GSI PK: vehicleId
GSI SK: recordedAt
```

---

## 8. セキュリティ・認証要件

### 7-1. 認証フロー

```
未認証アクセス
  → middleware.ts が /auth へリダイレクト
  → 合言葉入力
  → POST /api/auth でサーバーサイド照合
  → 一致: Cookie 付与 → / (車両選択) へリダイレクト
  → 不一致: エラーメッセージ表示
```

### 7-2. Cookie 仕様

| 属性 | 値 |
|------|----|
| 名前 | `is_authed` |
| 値 | 固定トークン（環境変数と照合） |
| HttpOnly | ✅ |
| Secure | ✅（HTTPS 前提） |
| SameSite | `Strict` |
| 有効期限 | **7 日間**（旅行期間を考慮） |

> ⚠️ 合言葉の比較は必ず **サーバーサイド（Route Handler）** で行うこと。
> ⚠️ `middleware.ts` は Edge Runtime のため `crypto` 等の Node.js 専用 API は使用不可。

### 7-3. 環境変数

#### Phase 1（Vercel）

```
PASSPHRASE=白川郷楽しみ
AUTH_TOKEN=<random_secret>
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-1
AWS_TRACKER_NAME=road-trip-tracker
AWS_MAP_NAME=road-trip-map
STALE_THRESHOLD_MINUTES=5
```

#### Phase 2 追加分（Supabase）

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...        # サーバーサイドのみ使用
```

#### Phase 3 置き換え分（DynamoDB）

```
# SUPABASE_* を削除して以下に置き換え
DYNAMODB_TABLE_NAME=road-trip
# AWS_ACCESS_KEY_ID 等は Location Service と共用
```

---

## 9. AWS Location Service 設計

### 8-1. リソース構成

| リソース | 名前 | 用途 |
|----------|------|------|
| Map | `road-trip-map` | 地図タイル配信 |
| Tracker | `road-trip-tracker` | 車両位置情報の管理 |

### 8-2. デバイス ID 命名規則

```
vehicle-001   # 1台目
vehicle-002   # 2台目
vehicle-003   # 3台目（Phase 2 以降）
```

> 📝 アルファベット形式（vehicle-a/b）だと追加時に運用が崩れやすいため連番を採用。

### 8-3. 使用 API

| 操作 | API |
|------|-----|
| 自車位置の更新 | `BatchUpdateDevicePosition` |
| 全車両の位置取得 | `ListDevicePositions` |

### 8-4. IAM 権限設計

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:BatchUpdateDevicePosition",
        "geo:ListDevicePositions",
        "geo:GetMapTile",
        "geo:GetMapGlyphs",
        "geo:GetMapSprites",
        "geo:GetMapStyleDescriptor"
      ],
      "Resource": [
        "arn:aws:geo:ap-northeast-1:*:tracker/road-trip-tracker",
        "arn:aws:geo:ap-northeast-1:*:map/road-trip-map"
      ]
    }
  ]
}
```

Phase 3 で DynamoDB を追加する際は以下を追記する。

```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:Query",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem"
  ],
  "Resource": "arn:aws:dynamodb:ap-northeast-1:*:table/road-trip"
}
```

---

## 10. 車両管理仕様

### 9-1. 車両情報の構造

```typescript
type Vehicle = {
  id: string;     // "vehicle-001"（システム固定）
  name: string;   // "たろう号車"（ユーザー設定）
  color: string;  // "#E53935"（HEX カラー）
};
```

### 9-2. 車両情報の保存場所

| 情報 | 保存場所 |
|------|---------|
| 車両 ID | AWS Location Service（トラッキングキー） |
| 車両名・色 | localStorage（端末ごとにローカル保存） |

> 📝 Phase 2 で車両設定を DB に保存して端末間同期を検討。

### 9-3. デフォルト設定

```
vehicle-001 / 名前: 車A / 色: 🔴 #E53935
vehicle-002 / 名前: 車B / 色: 🔵 #1E88E5
```

---

## 11. ディレクトリ構成

```
/
├── app/
│   ├── auth/page.tsx                  # 合言葉入力
│   ├── api/
│   │   ├── auth/route.ts              # 認証
│   │   ├── location/
│   │   │   ├── update/route.ts        # 位置更新
│   │   │   └── fetch/route.ts         # 全車両取得
│   │   └── trips/                     # Phase 2〜
│   │       ├── route.ts               # 旅行一覧・作成
│   │       ├── [tripId]/route.ts      # 旅行詳細・更新
│   │       └── [tripId]/history/route.ts  # 走行履歴
│   ├── (protected)/
│   │   ├── page.tsx                   # 車両選択
│   │   ├── settings/page.tsx          # 車両名・色設定
│   │   ├── map/page.tsx               # マップダッシュボード
│   │   └── history/                   # Phase 2〜
│   │       ├── page.tsx               # 旅行一覧
│   │       └── [tripId]/page.tsx      # 旅行別走行履歴マップ
│   └── layout.tsx
├── middleware.ts
├── components/
│   ├── MapView.tsx
│   ├── VehicleMarker.tsx
│   ├── StatusPanel.tsx
│   ├── UpdateFab.tsx
│   ├── VehicleSettingsForm.tsx
│   └── TripRouteLayer.tsx             # Phase 2〜（走行ルート描画）
└── lib/
    ├── locationClient.ts              # AWS Location Service ラッパー
    ├── auth.ts                        # Cookie ユーティリティ
    ├── vehicleStorage.ts              # localStorage 読み書き
    └── db/                            # Phase 2〜
        ├── ITripRepository.ts         # 抽象インターフェース
        ├── ILocationHistoryRepository.ts
        ├── supabase/                  # Phase 2 実装
        │   ├── SupabaseTripRepository.ts
        │   └── SupabaseLocationHistoryRepository.ts
        └── dynamodb/                  # Phase 3 実装
            ├── DynamoDBTripRepository.ts
            └── DynamoDBLocationHistoryRepository.ts
```

---

## 12. 画面構成と機能要件

### 11-1. 認証画面 `/auth`

- 合言葉の入力フォームと送信ボタンのみ
- 照合成功 → Cookie 付与（7 日間）→ `/` へ
- 照合失敗 → 「合言葉が違います」表示

### 11-2. 車両選択画面 `/`

```
[🔴 たろう号車のナビ担当]
[🔵 ジムカーのナビ担当]
[👀 見る専用]
[⚙️ 車両設定]
[📖 走行履歴]          ← Phase 2〜
```

### 11-3. 車両設定画面 `/settings`

- 各車両の名前・色（カラーピッカー）を編集
- localStorage に保存

### 11-4. マップダッシュボード `/map`

#### 位置更新ボタンの動作

**ナビ担当の場合**

```
1. GPS 取得（中精度: enableHighAccuracy: false、timeout: 10秒）
2. POST /api/location/update → AWS Tracker へ送信
   └─ Phase 2〜: DB（LocationPoint）へも追記
3. GET /api/location/fetch → 全車両位置取得
4. マーカー・ステータスパネルを再描画
```

**見る専用の場合**

```
1. GPS 取得・送信をスキップ
2. GET /api/location/fetch → 全車両位置取得
3. マーカー・ステータスパネルを再描画
```

#### ステータス表示

```
🔴 たろう号車（最終更新: 14:20）
🔵 ジムカー  （最終更新: 14:15）⚠️ データが古い可能性があります
```

- タイムスタンプは AWS Location Service の受信時刻を使用
- 5 分以上経過でグレーアウト＋警告表示

### 11-5. 走行履歴一覧画面 `/history`（Phase 2〜）

旅行ごとの走行記録を一覧表示する。

```
📍 白川郷旅行        2025/05/03〜05/05   [地図を見る]
📍 京都ドライブ      2025/04/12          [地図を見る]
📍 箱根旅行         2025/03/20〜03/21   [地図を見る]

[＋ 新しい旅行を開始]
```

### 11-6. 走行履歴マップ画面 `/history/[tripId]`（Phase 2〜）

旅行別の走行ルートをマップ上に描画する。

- 旅行名・期間を画面上部に表示
- 各車両の走行軌跡を **車両の色でルート線描画**
- 車両ごとの表示切替（トグル）
- 軌跡の各ポイントをタップするとタイムスタンプを表示

---

## 13. エラーハンドリング

### 12-1. オフライン検知

- `navigator.onLine` で確認
- オフライン時: トースト「オフラインです。通信が回復するまで更新されません」
- 直前の表示を維持（クリアしない）

### 12-2. GPS 取得失敗

| エラー | 表示メッセージ |
|--------|--------------|
| `PERMISSION_DENIED` | 「位置情報の使用が許可されていません。設定から許可してください」 |
| `POSITION_UNAVAILABLE` | 「現在地を取得できませんでした。電波の良い場所へ移動してください」 |
| `TIMEOUT` | 「位置情報の取得がタイムアウトしました。再度お試しください」 |

> ⚠️ GPS 失敗時も他車両の位置取得は続行する。

### 12-3. AWS / DB API エラー

| エラー | 表示メッセージ |
|--------|--------------|
| HTTP 5xx | 「サーバーエラーが発生しました。しばらく待ってから再試行してください」 |
| HTTP 4xx | 「取得に失敗しました（コード: XXX）」 |
| タイムアウト（10 秒） | 「タイムアウトしました。再度お試しください」 |

---

## 14. 非機能要件

### 13-1. レスポンシブ対応

| デバイス | 対応レベル |
|---------|----------|
| スマートフォン縦持ち | ★★★ メインターゲット |
| スマートフォン横持ち | ★★ 動作確認する |
| PC（デスクトップ） | ★ 一応閲覧できれば OK |

### 13-2. パフォーマンス

- 更新ボタン処理中は連打防止
- マーカー更新は差分のみ（全体再描画を避ける）
- 走行履歴の取得は旅行単位でページング対応

### 13-3. 手動更新の運用ルール

初回起動時にモーダル表示。

> スリープ中は位置情報が更新されません。現在地を確認・知らせたいときは [🔄 更新ボタン] を 1 回タップしてください。

「次回から表示しない」を localStorage に保存。

---

## 15. スコープ整理

### Phase 1 MUST（旅行前に完成）

- [ ] 合言葉認証（Cookie 7 日間）
- [ ] 車両選択（2 台 + 見る専用）
- [ ] 車両名・色のカスタマイズ（localStorage）
- [ ] 手動更新ボタンによる位置送受信
- [ ] カラーマーカーのマップ表示
- [ ] タイムスタンプ表示・鮮度警告（5 分）
- [ ] オフライン検知・GPS エラーハンドリング
- [ ] Vercel デプロイ・スマホ実機確認

### Phase 2（旅行後・機能拡張）

- [ ] Supabase セットアップ・DB 抽象化層の実装
- [ ] 旅行の作成・管理機能
- [ ] 位置更新時に LocationPoint を DB へ追記
- [ ] 走行履歴一覧・走行履歴マップ画面
- [ ] 車両の動的追加
- [ ] 自動更新モード（Wake Lock API 検討）
- [ ] 車両設定の端末間同期

### Phase 3（旅行後・インフラ学習）

- [ ] AWS Amplify Hosting への移行
- [ ] GitHub → Amplify CI/CD パイプライン構築
- [ ] `amplify.yml` の作成・ブランチ戦略
- [ ] DynamoDB テーブル設計・実装
- [ ] DynamoDB Repository 実装（Supabase 実装を置き換え）
- [ ] IAM ポリシーに DynamoDB 権限を追加

---

## 16. 推奨開発スケジュール（Phase 1・1 週間）

| 日数 | タスク |
|------|------|
| **Day 1** | AWS セットアップ（IAM・Tracker・Map）/ Next.js プロジェクト初期化 |
| **Day 2** | 合言葉認証（Route Handler + Cookie + middleware） |
| **Day 3** | 車両選択画面・車両設定画面・localStorage 連携 |
| **Day 4** | MapLibre GL JS でマップ表示・カラーマーカー描画 |
| **Day 5** | 位置送受信 API・更新ボタン・タイムスタンプ表示 |
| **Day 6** | エラーハンドリング・オフライン対応・鮮度警告・初回モーダル |
| **Day 7** | Vercel デプロイ・スマホ実機テスト・細部調整 |

> 📝 **Day 1 に AWS 設定を完了させることが最重要。** 後続の開発がすべて AWS Location Service に依存するため。

---

## 付録A: 画面遷移フロー

```
[未認証アクセス]
  ↓ middleware.ts
[/auth] 合言葉入力
  ↓ 照合成功 → Cookie 付与（7日間）
[/] 車両選択
  ├─ [⚙️ 車両設定] ──→ [/settings] ──→ [/]
  ├─ [📖 走行履歴] ──→ [/history] ──→ [/history/:id]  ← Phase 2〜
  └─ 役割選択
[/map] マップダッシュボード
  ↓ 更新ボタン押下
  ├─ 自車位置送信（ナビ担当のみ）
  │    └─ Phase 2〜: DB に LocationPoint を追記
  └─ 全車両位置取得 → 再描画
```

---

## 付録B: DB 移行チェックリスト（Phase 2 → Phase 3）

```
1. DynamoDB テーブル作成（6-4 章のテーブル設計に従う）
2. IAM ポリシーに DynamoDB 権限を追加（8-4 章）
3. DynamoDBTripRepository を実装（ITripRepository を満たす）
4. DynamoDBLocationHistoryRepository を実装
5. Route Handler の依存注入先を Supabase → DynamoDB に切り替え
6. 環境変数を更新（SUPABASE_* を削除、DYNAMODB_TABLE_NAME を追加）
7. Supabase のデータを DynamoDB へマイグレーション（必要な場合）
8. 動作確認後 Supabase プロジェクトを削除
```

---

## 付録C: AWS セットアップ手順（Day 1）

```
1. IAM ユーザー作成
   - 名前: road-trip-app
   - 8-4 章の JSON をインラインポリシーとして付与
   - アクセスキーを発行 → .env.local に設定

2. AWS Location Service v2
   - Map リソース作成: road-trip-map
   - Tracker リソース作成: road-trip-tracker

3. Vercel プロジェクト作成
   - GitHub リポジトリと連携
   - Environment variables に 7-3 章（Phase 1 分）を設定

4. 動作確認
   - デプロイ済み URL でアプリにアクセス
   - スマホ実機で位置情報の送受信を確認
```
