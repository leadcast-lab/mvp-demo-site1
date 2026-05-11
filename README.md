# LeadCast — MVP デモサイト & 開発環境ガイド

本リポジトリは LeadCast プロジェクトの MVP デモサイト（静的 UI モック）と、今後の本格開発に向けた開発環境の標準構成を提供する。

- デモサイト（GitHub Pages 公開）: https://leadcast-lab.github.io/mvp-demo-site1/
- プロジェクト概要・要件: [CLAUDE.md](./CLAUDE.md)
- 機能要件詳細: [docs/leadcast_requirements.md](./docs/leadcast_requirements.md)
- 画面一覧: [docs/leadcast_screens.md](./docs/leadcast_screens.md)

> 注: 本 README で記載する `apps/`, `packages/`, `infra/` 等のディレクトリは、Feature-Phase 1（MVP）開発開始時に初期化する。現時点（2026-05）では `site/` 配下の静的 HTML デモのみ存在する。

---

## 目次

1. [全体方針](#1-全体方針)
2. [前提ツール（必須）](#2-前提ツール必須)
3. [初回セットアップ手順](#3-初回セットアップ手順)
4. [日常の開発フロー](#4-日常の開発フロー)
5. [ディレクトリ構成](#5-ディレクトリ構成)
6. [環境階層](#6-環境階層)
7. [ブランチ戦略・リリースサイクル](#7-ブランチ戦略リリースサイクル)
8. [CI/CD](#8-cicd)
9. [監視・ロギング](#9-監視ロギング)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 全体方針

| 領域 | 採用技術 |
|---|---|
| 言語 | TypeScript（strict mode、`noUncheckedIndexedAccess` 有効） |
| ランタイム | Node.js LTS（バージョンは `.nvmrc` / `.tool-versions` で固定） |
| パッケージマネージャ | **pnpm**（npm/yarn は使用しない） |
| モノレポ管理 | **Turborepo** |
| フロントエンド | Next.js 15+（App Router）+ Tailwind CSS + shadcn/ui |
| バックエンド | NestJS |
| ORM | Drizzle ORM |
| ローカルミドルウェア | **Docker Compose**（PostgreSQL / Redis / Meilisearch / ClickHouse / MinIO / MailHog） |
| 本番実行環境 | AWS ECS Fargate（東京リージョン） |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| 機能フラグ | GrowthBook（self-hosted） |
| 監視 | Sentry + Datadog + OpenTelemetry |

**ローカル開発の原則**: ミドルウェア（DB・キャッシュ・検索・ストレージ等）は Docker Compose で起動し、アプリケーション本体（Node.js）はホスト OS で直接実行する。Hot reload と VS Code デバッガ接続を高速に保つため。

---

## 2. 前提ツール（必須）

| ツール | バージョン | 用途 | インストール方法 |
|---|---|---|---|
| **Node.js** | LTS（`.nvmrc` 参照） | アプリケーション実行 | Volta または asdf 経由を推奨 |
| **Volta** | 最新 | Node バージョン固定 | https://volta.sh |
| **pnpm** | 9.x 以上 | パッケージ管理 | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Docker Desktop** | 最新 | ミドルウェア起動 | https://www.docker.com/products/docker-desktop |
| **Git** | 2.40+ | バージョン管理 | OS 標準または公式 |
| **AWS CLI v2** | 最新 | クラウド操作 | https://aws.amazon.com/cli/ |
| **Terraform** | 1.7+ | IaC 適用 | tfenv 経由を推奨 |
| **direnv** | 最新 | `.env` 自動切替 | https://direnv.net |
| **VS Code** | 最新 | エディタ（推奨） | 拡張機能リストは `.vscode/extensions.json` |

### Windows ユーザーへの注意

- 開発は **WSL2（Ubuntu 22.04 LTS）** 上で行うこと。Windows ネイティブのファイル I/O は Docker との連携で遅くなる
- リポジトリは WSL2 側のホームディレクトリ配下に clone する（`/mnt/c/` 配下は不可）
- Docker Desktop は **WSL2 backend** を有効化する

### macOS ユーザーへの注意

- Apple Silicon（M1/M2/M3）の場合、Docker イメージは `linux/arm64` を優先取得する
- 一部の x86 専用イメージは `platform: linux/amd64` を明示する必要あり

---

## 3. 初回セットアップ手順

### 3.1 リポジトリの取得

```bash
git clone git@github.com:leadcast-lab/mvp-demo-site1.git
cd mvp-demo-site1
```

### 3.2 Node.js バージョンの統一

```bash
# Volta 利用の場合
volta install node@lts

# asdf 利用の場合
asdf install
```

### 3.3 依存関係インストール

```bash
corepack enable
pnpm install
```

### 3.4 環境変数の設定

```bash
cp .env.example .env
direnv allow
```

`.env` に以下を最低限設定する（詳細は `.env.example` のコメント参照）:

```bash
# データベース
DATABASE_URL=postgresql://leadcast:leadcast@localhost:5432/leadcast_dev

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey

# S3 互換（MinIO）
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=leadcast-dev

# 認証
AUTH_SECRET=（`openssl rand -base64 32` で生成）

# 外部 API（開発用ダミー or 個別アカウント）
SALESFORCE_CLIENT_ID=
HUBSPOT_API_KEY=
SENTRY_DSN=
```

**重要**: `.env` は絶対に Git にコミットしない（`.gitignore` で除外済み）。本番のシークレットは AWS Secrets Manager 管理。

### 3.5 ミドルウェアの起動

```bash
docker compose up -d
```

起動するサービス:

| サービス | ポート | 管理 UI |
|---|---|---|
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| Meilisearch | 7700 | http://localhost:7700 |
| ClickHouse | 8123 | http://localhost:8123/play |
| MinIO（S3 互換） | 9000 / 9001 | http://localhost:9001 |
| MailHog（メール開発） | 1025 / 8025 | http://localhost:8025 |

起動確認:

```bash
docker compose ps
```

### 3.6 DB マイグレーション・シード

```bash
pnpm db:migrate
pnpm db:seed   # 開発用ダミーデータ投入
```

### 3.7 アプリケーション起動

```bash
# すべて並列起動（Turborepo）
pnpm dev

# 個別起動の場合
pnpm --filter @leadcast/web dev    # Next.js: http://localhost:3000
pnpm --filter @leadcast/api dev    # NestJS:  http://localhost:4000
```

### 3.8 動作確認

- 配信者ダッシュボード: http://localhost:3000/admin
- 視聴者プレイヤー: http://localhost:3000/v/sample
- API ヘルスチェック: http://localhost:4000/health
- Storybook: `pnpm storybook` → http://localhost:6006

---

## 4. 日常の開発フロー

### 4.1 ブランチ作成

```bash
git switch -c feat/F-2-1-turnstile-email-gate
```

ブランチ名規約: `<type>/<要件番号>-<短い説明>`

| type | 用途 |
|---|---|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | リファクタ |
| `chore` | ビルド・依存更新 |
| `docs` | ドキュメント |
| `test` | テスト追加 |

### 4.2 開発中によく使うコマンド

| コマンド | 用途 |
|---|---|
| `pnpm dev` | 全アプリ同時起動 |
| `pnpm build` | 全アプリビルド |
| `pnpm test` | 全テスト実行（Vitest） |
| `pnpm test:e2e` | E2E テスト（Playwright） |
| `pnpm lint` | Lint（Biome） |
| `pnpm typecheck` | 型チェック（`tsc --noEmit`） |
| `pnpm db:migrate` | DB マイグレーション適用 |
| `pnpm db:migrate:create <name>` | 新規マイグレーション生成 |
| `pnpm db:studio` | Drizzle Studio 起動 |
| `pnpm storybook` | Storybook 起動 |
| `docker compose logs -f <service>` | ミドルウェアログ確認 |
| `docker compose down -v` | ミドルウェア停止＋ボリューム削除（DB リセット） |

### 4.3 コミットメッセージ規約（Conventional Commits）

```
<type>(<scope>): <要件番号> <概要>

例:
feat(api): F-2-1 Turnstile 型メールゲートのインタラクション API を追加
fix(web): F-3-1 リード一覧のページネーションが壊れていた問題を修正
chore(deps): Drizzle ORM を 0.30.x に更新
```

要件番号（F-X-Y）は必ず含めること。CLAUDE.md「エージェントへの指示」に準拠。

### 4.4 PR 作成

- main ブランチへの PR を作成
- テンプレート（`.github/PULL_REQUEST_TEMPLATE.md`）に従い記入
- **最低 1 名のレビュアー承認** が必須（SOC 2 監査要件）
- CI（lint, typecheck, test, build, security scan）の全通過が必須
- 関連する画面 ID（S-XXX-XX-XX）・要件番号（F-X-Y）を記載

---

## 5. ディレクトリ構成

```
leadcast/
├── CLAUDE.md                    # プロジェクト方針（必読）
├── README.md                    # 本ファイル
├── docs/
│   ├── leadcast_requirements.md
│   └── leadcast_screens.md
├── site/                        # MVP UI モック（GitHub Pages 公開）
├── apps/
│   ├── web/                     # Next.js（配信者ダッシュボード + 視聴者プレイヤー）
│   └── api/                     # NestJS API サーバー
├── packages/
│   ├── ui/                      # 共通デザインシステム（shadcn/ui ベース）
│   ├── db/                      # Drizzle スキーマ・マイグレーション
│   ├── shared/                  # 型定義・ユーティリティ・Zod スキーマ
│   └── video-player/            # カスタム動画プレイヤー
├── infra/
│   ├── modules/                 # Terraform 再利用モジュール
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
├── docker/
│   └── compose/                 # 補助的な compose ファイル
├── docker-compose.yml           # ローカル開発用ミドルウェア定義
├── turbo.json                   # Turborepo 設定
├── pnpm-workspace.yaml
├── .env.example
├── .nvmrc
└── .github/
    └── workflows/               # CI/CD
```

---

## 6. 環境階層

| 環境 | 用途 | デプロイ契機 | AWS アカウント |
|---|---|---|---|
| **local** | 開発者個人 PC | 手動（`pnpm dev`） | — |
| **dev** | 共有開発環境（最新 main） | main マージで自動 | leadcast-dev |
| **staging** | リリース候補検証（本番同一構成） | リリースタグで手動 | leadcast-staging |
| **production** | 本番 | staging 承認後に手動昇格 | leadcast-prod |

AWS アカウントは AWS Organizations 配下で分離する。SSO は AWS IAM Identity Center を使用。

---

## 7. ブランチ戦略・リリースサイクル

### 7.1 Trunk-Based Development

- main ブランチが常にデプロイ可能状態
- feature ブランチは 2〜3 日以内に main へ merge
- 未完成機能は **Feature Flag**（GrowthBook）で本番 off

### 7.2 リリースサイクル

| 期間 | サイクル |
|---|---|
| MVP 開発中（〜ローンチ前） | 機能完成都度 dev → staging へデプロイ |
| ローンチ後 6 ヶ月 | **週次本番リリース（毎週水曜 14:00 固定）** |
| GTM-Phase 2 以降 | 任意デプロイ（信頼性向上後） |
| 緊急時 | Hotfix（main から即時） |

### 7.3 タグ運用

```
v<major>.<minor>.<patch>
例: v1.4.2

リリース手順:
  1. main から `release/v1.4.2` ブランチを切らない（直接タグ運用）
  2. main の commit に `git tag v1.4.2` を打つ
  3. GitHub Actions が staging に自動デプロイ
  4. QA 承認後、production へ手動昇格
```

---

## 8. CI/CD

### 8.1 GitHub Actions ワークフロー

| トリガー | 実行内容 |
|---|---|
| **PR 作成・更新** | Lint / Typecheck / Unit test / Build / Dependency scan / Trivy（コンテナイメージスキャン） |
| **main マージ** | 上記すべて + Docker build & push (ECR) + dev 環境デプロイ + Playwright E2E |
| **タグ push（v*）** | staging デプロイ + Smoke test |
| **手動 workflow_dispatch** | production デプロイ（承認必須） |

### 8.2 ブランチ保護ルール（main）

- 直接 push 禁止
- PR レビュー最低 1 名必須
- CI 全通過必須
- コミット署名（GPG）必須
- Stale review は dismiss
- 管理者も例外なく適用

### 8.3 デプロイ戦略

- ECS Fargate での **Blue/Green デプロイ**（CodeDeploy 経由）
- 異常時は CloudWatch Alarm 連動で自動ロールバック
- Database マイグレーションは**後方互換性必須**（add → backfill → switch → remove の 4 段階で破壊的変更を分割）

---

## 9. 監視・ロギング

| 用途 | ツール | 設定場所 |
|---|---|---|
| エラートラッキング | Sentry | `SENTRY_DSN` 環境変数 |
| APM・インフラ監視 | Datadog | Datadog Agent を ECS sidecar として配置 |
| ログ集約 | CloudWatch Logs → Datadog Logs | Terraform で連携設定 |
| 計装規格 | OpenTelemetry | アプリ起動時に SDK 初期化 |
| プロダクト分析 | PostHog（self-hosted） | フロント・バック両方から計装 |
| インシデント通知 | PagerDuty + Slack | Datadog Monitor から発火 |

**原則**: 新規サービス・新規エンドポイントを追加する際は、ログ・メトリクス・トレースの 3 点セットを必ず計装する（後付け不可）。

---

## 10. トラブルシューティング

### 10.1 `pnpm install` が失敗する

```bash
# Node バージョン確認
node --version  # `.nvmrc` と一致しているか
pnpm --version  # 9.x 以上か

# キャッシュクリア
pnpm store prune
rm -rf node_modules
pnpm install
```

### 10.2 Docker Compose のサービスが起動しない

```bash
# ログ確認
docker compose logs <service>

# ポート競合の場合（例: 5432 が既存 PG と衝突）
sudo lsof -i :5432  # 占有プロセス確認
# .env で `POSTGRES_PORT` を 5433 等に変更

# 完全リセット（データも消える）
docker compose down -v
docker compose up -d
```

### 10.3 DB マイグレーションが失敗する

```bash
# ローカル DB を完全初期化
docker compose down -v
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
```

### 10.4 Hot reload が効かない（WSL2）

- リポジトリが `/mnt/c/` 配下にある場合、WSL2 のホームディレクトリ（`~/`）に移動する
- VS Code は「Remote-WSL」拡張機能で WSL2 側を開く

### 10.5 Sentry にエラーが送られない

- `SENTRY_DSN` が `.env` に設定されているか確認
- 開発環境では `SENTRY_ENVIRONMENT=local` でフィルタされている場合あり
- Sentry プロジェクトの inbound filter 設定を確認

---

## 関連ドキュメント

- [CLAUDE.md](./CLAUDE.md) — プロジェクト全体方針・コーディング規約
- [docs/leadcast_requirements.md](./docs/leadcast_requirements.md) — 機能要件
- [docs/leadcast_screens.md](./docs/leadcast_screens.md) — 画面一覧

## ライセンス

本リポジトリは現時点で社内開発用。外部公開時にライセンスを別途定義する。
