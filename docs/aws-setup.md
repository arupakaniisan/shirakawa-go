# AWS セットアップ手順書

> Day 1 作業 / 所要時間目安: 30〜45 分
> Location Service v2 対応版

---

## 作業の全体像

```
STEP 1  IAM ユーザー作成（10分）  ← なぜ必要か説明あり
STEP 2  IAM ポリシーの設定（5分）
STEP 3  アクセスキーの発行（3分）
STEP 4  API キーの作成（5分）     ← 地図表示用
STEP 5  Tracker の作成（5分）
STEP 6  動作確認（CLI）（10分）
STEP 7  .env.local に設定（5分）
```

> ⚠️ **リージョンは `ap-northeast-1`（東京）に固定する。**
> AWS コンソール右上のリージョン表示が「アジアパシフィック（東京）」になっていることを
> 各 STEP の最初に必ず確認すること。

---

## そもそも IAM って何？なぜ必要？

### 「鍵を渡す」というイメージ

AWS には S3・RDS・Location Service など大量のサービスがある。
デフォルトでは **何も触れない**。「この人（アプリ）はこのサービスだけ触っていい」という
許可証を発行するのが **IAM（Identity and Access Management）** の仕事。

```
AWS アカウント（家全体）
├─ S3（押し入れ）
├─ DynamoDB（金庫）
├─ Location Service（地図室）  ← 今回ここだけ触りたい
└─ EC2（工場）

IAM ユーザー road-trip-app に
「地図室だけ入っていいよ」という鍵を渡す
  → 他の部屋（S3・金庫・工場）には入れない
```

### なぜ root アカウントを直接使わないのか

AWS に最初にログインするときのアカウント（メールアドレスでログインするやつ）を
**root アカウント** という。root はすべての権限を持つ「マスターキー」。

```
root アカウントのキー = マスターキー（全部屋に入れる）
  ↓ もし漏洩したら
  全サービスを操作される・多額の請求が来る・最悪アカウント乗っ取り
```

だから root は「AWS コンソールへのログイン専用」として使い、
**アプリ用には専用の IAM ユーザーを作って最小限の権限だけ渡す**のが鉄則。

### 今回の構成

```
root アカウント
  └─（コンソールへのログインのみ使用）

IAM ユーザー: road-trip-app
  └─ 権限: Location Service の Tracker 操作のみ
      └─ .env.local に書いてアプリから使う
```

---

## STEP 1: IAM ユーザーの作成

### 1-1. IAM コンソールを開く

1. AWS マネジメントコンソール（https://console.aws.amazon.com）に **root でログイン**
2. 上部の検索バーに `IAM` と入力 → IAM コンソールへ移動
3. 左ナビから **「ユーザー」** を選択
4. 右上の **「ユーザーを作成」** ボタンをクリック

### 1-2. ユーザー名を設定

| 項目 | 値 |
|------|-----|
| ユーザー名 | `road-trip-app` |
| AWS マネジメントコンソールへのアクセスを提供 | **チェックしない** |

> 📝 「コンソールへのアクセス」は人間がブラウザでログインするためのもの。
> アプリ（プログラム）からのアクセスには不要なのでチェックしない。

「次へ」をクリック。

### 1-3. 許可を設定

- 「許可のオプション」で **「ポリシーを直接アタッチする」** を選択
- ポリシーは**何も選択しない**でそのまま「次へ」をクリック

> 📝 `AmazonLocationServiceFullAccess` のような既存ポリシーは権限が広すぎる。
> STEP 2 で必要な権限だけを手動で設定する。

### 1-4. 確認・作成

内容を確認して **「ユーザーを作成」** をクリック。

---

## STEP 2: IAM インラインポリシーの設定

### ポリシーって何？

「この IAM ユーザーに何を許可するか」を JSON で書いたルール書。
今回は「`road-trip-tracker` の読み書きだけ許可」という内容を書く。

### 2-1. 作成したユーザーを開く

1. IAM → ユーザー一覧から `road-trip-app` をクリック
2. **「許可」** タブを選択
3. 「許可を追加」プルダウン →  **「インラインポリシーを作成」** をクリック

### 2-2. ポリシーを JSON で入力

画面上部の **「JSON」** タブをクリックし、
既存の内容を**全部消して**以下を貼り付ける。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:BatchUpdateDevicePosition",
        "geo:ListDevicePositions"
      ],
      "Resource": [
        "arn:aws:geo:ap-northeast-1:*:tracker/road-trip-tracker"
      ]
    }
  ]
}
```

**このポリシーの意味:**

| 項目 | 意味 |
|------|------|
| `Effect: Allow` | 以下の操作を「許可」する |
| `BatchUpdateDevicePosition` | 車両の位置情報を AWS に送信する操作 |
| `ListDevicePositions` | 全車両の最新位置情報を取得する操作 |
| `Resource` | 操作対象を `road-trip-tracker` だけに限定 |

> ⚠️ v2 では地図表示は API キー（STEP 4）で行うため、
> `geo:GetMapTile` 等の Map 権限はここに不要。

### 2-3. ポリシー名を付けて保存

| 項目 | 値 |
|------|-----|
| ポリシー名 | `road-trip-location-policy` |

**「ポリシーを作成」** をクリック。

---

## STEP 3: アクセスキーの発行

### アクセスキーって何？

IAM ユーザー `road-trip-app` が「自分だ」と証明するための ID とパスワードのセット。

```
アクセスキー ID     = ユーザー名のようなもの（公開しても一応OK）
シークレットアクセスキー = パスワードのようなもの（絶対に公開しない）
```

アプリはこの 2 つを `.env.local` に書いておくことで、
AWS に「私は road-trip-app です」と認証できる。

### 3-1. アクセスキーを作成

1. IAM → ユーザー → `road-trip-app` → **「セキュリティ認証情報」** タブ
2. 「アクセスキー」セクションの **「アクセスキーを作成」** をクリック

### 3-2. ユースケースを選択

**「サードパーティーサービス」** を選択。
（Vercel というサードパーティから AWS を呼び出すイメージ）

チェックボックス「上記のレコメンデーションを理解し〜」にチェック → 「次へ」。

### 3-3. キーを保存

> ⚠️ **この画面を閉じると「シークレットアクセスキー」は二度と表示されない。必ず今保存する。**

「.csv ファイルをダウンロード」してローカルに保存しておくのが確実。

---

## STEP 4: API キーの作成（地図表示用）

### 4-1. API キーコンソールを開く

1. Location Service コンソール左ナビ → **「API keys」**
2. **「API キーの作成」** をクリック

### 4-2. API キーの設定

| 項目 | 値 | 備考 |
|------|-----|------|
| 名前 | `road-trip-map-key` | 任意の名前 |
| 有効期限 | **チェックしない** | 有効期限なし |
| クライアント制限 | **設定しない** | 開発中は制限しない |

**マップアクションで選択するもの:**

```
✅ GetTile      ← これだけチェック（地図タイルの表示）
□ GetStaticMap ← 不要（静止画マップ用なので今回は使わない）
```

> 📝 「場所」「ルート」のアクションはすべてチェック不要。

### 4-3. 作成・キー値を保存

**「API キーの作成」** をクリック。

> ⚠️ **作成直後に表示される `v1.public.ey...` という文字列が API キーの値。**
> 後から確認できないので必ずコピーして手元に保存しておく。

### API キーは公開して OK？

```
IAM アクセスキー  → サーバーサイド専用・絶対に公開しない
API キー          → クライアントサイド用・公開しても OK（地図表示しかできない制限付き）
```

API キーは地図タイルの表示しかできないため、
`.env.local` に `NEXT_PUBLIC_MAP_API_KEY=v1.public.ey...` として書いてよい。

---

## STEP 5: Tracker の作成

### Tracker って何？

「どの車両が今どこにいるか」を記録・管理するための AWS リソース。

```
アプリ（スマホ）
  └─ 更新ボタン押下
      └─ 自分の GPS 座標 → AWS Tracker に送信（BatchUpdateDevicePosition）
                         → 他車両の最新位置を取得（ListDevicePositions）
```

### 5-1. Tracker コンソールを開く

1. Location Service コンソール左ナビ → **「Trackers」**
2. **「Create tracker」** をクリック

### 5-2. Tracker の設定

| 項目 | 値 | 備考 |
|------|-----|------|
| Name | `road-trip-tracker` | 要件定義のリソース名と一致させる |
| Description | `Road trip vehicle tracker` | 任意 |
| Position filtering | **「AccuracyBased」** | 下記参照 |
| EventBridge | **オフ** | 今回は不要 |
| Customer managed key | **設定しない** | デフォルトで OK |

**Position filtering の意味:**

手動更新ボタンを押すたびに位置情報が送られるが、
GPS の誤差でほぼ同じ場所なのに微妙にずれた座標が記録されることがある（ジッター）。
`AccuracyBased` は GPS の精度情報をもとにノイズを除去してくれる。

| オプション | 動作 |
|-----------|------|
| `TimeBased` | 短時間での連続更新を破棄 |
| `DistanceBased` | 一定距離未満の移動を破棄 |
| **`AccuracyBased`** | GPS 精度に基づいてノイズを除去 ← これを選ぶ |

### 5-3. 作成

**「Create tracker」** をクリック。
一覧に `road-trip-tracker` が表示されれば成功。

---

## STEP 6: 動作確認（AWS CLI）

> ⏭️ CLI に慣れていない場合はスキップして STEP 7 へ。
> 実装後にアプリ経由でも確認できる。

### 6-1. AWS CLI のセットアップ

```bash
aws configure
# AWS Access Key ID:     → STEP 3 で発行したアクセスキー ID
# AWS Secret Access Key: → STEP 3 で発行したシークレットアクセスキー
# Default region name:   → ap-northeast-1
# Default output format: → json
```

### 6-2. Tracker の確認

```bash
aws location describe-tracker \
  --tracker-name road-trip-tracker \
  --region ap-northeast-1
```

`"TrackerName": "road-trip-tracker"` が返れば成功。

### 6-3. テスト位置情報の送信

```bash
aws location batch-update-device-position \
  --tracker-name road-trip-tracker \
  --updates '[
    {
      "DeviceId": "vehicle-001",
      "Position": [139.7671, 35.6812],
      "SampleTime": "2025-05-01T10:00:00Z"
    }
  ]' \
  --region ap-northeast-1
```

`{"Errors": []}` が返れば成功。

### 6-4. 位置情報の取得確認

```bash
aws location list-device-positions \
  --tracker-name road-trip-tracker \
  --region ap-northeast-1
```

`vehicle-001` の座標が返れば送受信の動作確認完了。

---

## STEP 7: .env.local に設定

プロジェクトルートに `.env.local` を作成する。

```bash
# =============================
# 認証
# =============================
PASSPHRASE=白川郷楽しみ
AUTH_TOKEN=ここにランダムな文字列（下記コマンドで生成）

# =============================
# AWS（サーバーサイド・Tracker 用）
# ※ NEXT_PUBLIC_ を付けないこと
# =============================
AWS_ACCESS_KEY_ID=STEP3のアクセスキーIDをここに
AWS_SECRET_ACCESS_KEY=STEP3のシークレットアクセスキーをここに
AWS_REGION=ap-northeast-1
AWS_TRACKER_NAME=road-trip-tracker

# =============================
# AWS Location Service v2 Map 用
# ※ NEXT_PUBLIC_ を付けてよい（地図表示しかできない制限付きキー）
# =============================
NEXT_PUBLIC_MAP_API_KEY=STEP4で保存したv1.public.ey...の値
NEXT_PUBLIC_AWS_REGION=ap-northeast-1

# =============================
# アプリ設定
# =============================
STALE_THRESHOLD_MINUTES=5
```

`AUTH_TOKEN` のランダム文字列の生成:

```bash
openssl rand -hex 32
# 例: a3f8c2e1d4b5...
```

### .gitignore の確認

`.env.local` が GitHub に上がらないことを確認する。

```bash
cat .gitignore | grep env
# .env.local  ← この行があればOK
```

> ⚠️ `.env.local` を絶対に GitHub に push しないこと。
> AWS のアクセスキーが漏洩すると多額の請求やアカウント乗っ取りのリスクがある。

---

## Vercel への環境変数の設定

Vercel コンソール → プロジェクト → **「Settings」** → **「Environment Variables」** で以下を設定する。

| Name | Value | 備考 |
|------|-------|------|
| `PASSPHRASE` | 合言葉 | |
| `AUTH_TOKEN` | ランダムトークン | |
| `AWS_ACCESS_KEY_ID` | STEP 3 のキー ID | |
| `AWS_SECRET_ACCESS_KEY` | STEP 3 のシークレット | |
| `AWS_REGION` | `ap-northeast-1` | |
| `AWS_TRACKER_NAME` | `road-trip-tracker` | |
| `NEXT_PUBLIC_MAP_API_KEY` | STEP 4 の API キー値 | |
| `NEXT_PUBLIC_AWS_REGION` | `ap-northeast-1` | |
| `STALE_THRESHOLD_MINUTES` | `5` | |

---

## MapLibre GL JS での地図表示（v2 の書き方）

実装時に参照すること。v2 ではスタイル URL の形式が変わっている。

```typescript
// ❌ v1（旧・使わない）
// `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor`

// ✅ v2（新・これを使う）
const styleUrl =
  `https://maps.geo.${region}.amazonaws.com/v2/styles/Standard/descriptor` +
  `?key=${apiKey}`;

const map = new maplibregl.Map({
  container: 'map',
  style: styleUrl,
  center: [136.9, 35.5], // 初期表示: 日本中部あたり
  zoom: 7,
});
```

---

## 完了チェックリスト

```
[ ] IAM ユーザー road-trip-app を作成した
[ ] インラインポリシー road-trip-location-policy をアタッチした
    （Tracker の BatchUpdateDevicePosition / ListDevicePositions のみ）
[ ] アクセスキー ID とシークレットアクセスキーを保存した（CSV）
[ ] API キー road-trip-map-key を作成し、キー値（v1.public.ey...）を保存した
[ ] Tracker リソース road-trip-tracker を東京リージョンに作成した
[ ] （任意）CLI で位置情報の送受信テストを実施した
[ ] .env.local を作成し、すべての値を記入した
[ ] .gitignore に .env.local が含まれていることを確認した
[ ] Vercel コンソールに環境変数を設定した
```

---

## よくあるミスと対処法

| ミス | 症状 | 対処 |
|------|------|------|
| リージョンが東京以外 | リソースが見つからない (`ResourceNotFoundException`) | コンソール右上でリージョンを東京に変更 |
| IAM ポリシーの Tracker 名が違う | `AccessDeniedException` | ポリシーの ARN の Tracker 名を実際の名前に合わせる |
| v1 の「Maps」メニューを探している | メニューが見つからない | v2 では不要。「API keys」から API キーを作成する |
| API キーの値を保存し忘れた | 再確認できない | API キーを削除して作り直す |
| `.env.local` に余分なスペース・引用符 | 認証エラー | 値は引用符なしで記載（`KEY=value` の形式） |
| `NEXT_PUBLIC_` を AWS アクセスキーに付けた | キーがクライアントに露出 | `NEXT_PUBLIC_` を削除して再デプロイ |
| アクセスキーを GitHub に push | セキュリティインシデント | 即座にキーを IAM で無効化→削除し新しいキーを発行 |

---

## 次のステップ（Day 2）

```
1. Next.js プロジェクトの初期化
2. GitHub リポジトリの作成・push
3. Vercel プロジェクトの作成・GitHub 連携
4. GitHub Actions ワークフローファイルの作成（ci.yml 等）
5. ブランチ保護ルールの設定
```
