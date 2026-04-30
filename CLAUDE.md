# LeadCast プロジェクト

## 概要

LeadCast は VidyardとWistia の「いいとこ取り」をした、企業向け動画配信＋インタラクティブリード管理 SaaS。動画閲覧者が動画内でインタラクティブにやり取りでき、その行動データがシームレスに CRM に連携される、もしくはサービス内でリードとして管理できる。

ターゲット市場は **日本 First**。グローバル展開は Phase 3 以降。

## プロジェクトドキュメント

詳細な機能要件は以下を参照すること。

@docs/leadcast_requirements.md

---

## デザイン方針

### 全体トーン

- **エンタープライズ B2B SaaS としての信頼感**を最優先。派手さよりも誠実さ・正確さ・効率を表現する
- 日本企業の意思決定者（マーケ部長、営業部長、情シス）が「導入稟議を通せる」見た目を担保する
- 過度にカジュアルな表現、絵文字、ポップな擬人化キャラクターは使わない
- 国内競合（SAKAS、Soraプロジェクト、ミルビィ等）よりも国際水準の洗練度を目指す

### 日本市場固有の UX 配慮

#### 情報密度
- 米国 SaaS よりも**情報密度を高め**に設計してよい。日本 B2B ユーザーは情報量を求める傾向がある
- ただし「詰め込み」ではなく構造化された密度。F パターンより Z パターンよりも、表形式・グリッドの整然さを重視
- ダッシュボードは「概要 → ドリルダウン」よりも「サマリー＋詳細を同一画面」を許容する

#### フォーム設計
- 氏名は **姓・名を別フィールド**、必要に応じて **ふりがな（セイ・メイ）** 自動補完を提供
- 郵便番号からの**住所自動補完**を必須機能とする（zipcloud API、Yahoo!郵便番号API、Japan Post API 等）
- 電話番号は日本国内フォーマット（ハイフン許容、自動整形）
- 会社名は法人格（株式会社、合同会社、(株)、㈱）の表記揺れを正規化して保存
- 必須／任意の表示は色だけでなくテキストでも明示
- エラーメッセージは**敬体（です・ます調）**、原因と対処を併記する

#### 名刺・組織情報
- 部署・役職は日本特有の階層（部 → 課 → 係、部長 → 課長 → 係長など）を扱える設計に
- 名刺取り込み（OCR）連携を将来的に視野に

#### 日付・時刻・通貨
- デフォルトは `YYYY/MM/DD` 形式。和暦（令和）切替もオプションで対応
- 時刻は 24 時間制
- 通貨は JPY、税込／税抜の表示を切替可能に

### タイポグラフィ

- 日本語フォント: **Noto Sans JP**（Google Fonts、Variable Font 推奨）をデフォルトに
- 英数字フォント: **Inter** または **Geist**（Noto Sans JP との混植バランスが良い）
- 数値（KPI、視聴回数等）は **等幅数字機能（tabular-nums）** を有効化
- 行間（line-height）は 1.7 〜 1.8 を基準（日本語は欧文より行間を広めに）
- 文字サイズは本文 14〜15px ベース、見出しはモジュラースケール

### カラーパレット

- **プライマリ**: ネイビー〜ダークブルー系（#1E3A8A 〜 #2563EB あたり）。日本 B2B における信頼の慣習色
- **アクセント**: 一色のみに絞る（例: ティールやエメラルド）。多色使いは避ける
- **警告色**: 赤の使用は慎重に。重大エラーや削除確認のみ。日本では赤＝禁止のシグナルが強い
- **成功色**: 緑（#10B981 系）。鮮やかすぎないトーンで
- 背景は純白（#FFFFFF）よりわずかにオフホワイト（#FAFAFA、#F8FAFC）を使うと視覚的に落ち着く
- ダークモードは Phase 2 以降。優先度は低い

### アクセシビリティ

- **WCAG 2.1 AA 準拠**を最低基準とする
- 国内基準として **JIS X 8341-3:2016** にも準拠
- カラーコントラスト比 4.5:1 以上（本文）、3:1 以上（大きいテキスト）
- すべてのインタラクション要素にキーボード操作を保証
- スクリーンリーダー対応（aria 属性、ランドマーク、適切な heading 階層）
- 動画にはデフォルトで日本語字幕、フォーカスインジケータを明示

### コンポーネント原則

- **shadcn/ui を起点に、日本市場向けにカスタマイズした自社デザインシステム**を構築
- すべてのコンポーネントに loading / empty / error / disabled の各状態を定義
- マイクロインタラクションは控えめ（過度なアニメーションは法人ユーザーに敬遠される傾向）
- モバイル優先ではなく **デスクトップ優先**（B2B 業務ユースが PC 中心のため）。ただしモバイルレスポンシブは必須

---

## 技術スタック

### フロントエンド

- **Next.js 15+ (App Router)**: SSR/RSC を活用、SEO 重視のランディングと動画埋め込みプレイヤー両方に対応
- **TypeScript** (strict mode、`noUncheckedIndexedAccess` も有効化)
- **Tailwind CSS** + **shadcn/ui**（Radix UI ベース）
- **TanStack Query** (Server State) + **Zustand** (Client State) の二段構成
- **React Hook Form** + **Zod**: フォーム＋バリデーション
- **next-intl**: 国際化（日本語をプライマリ、英語をセカンダリで実装）
- **Storybook**: 自社デザインシステムの整備

### バックエンド

- **Node.js (LTS)** + **TypeScript** で統一（フロントとの型共有を最大化）
- **NestJS** または **Hono**: API サーバー。エンタープライズ向け機能が多い NestJS を推奨
- **tRPC** または **OpenAPI（typed-openapi）**: 型安全な API 通信
- **BullMQ**（Redis 上のジョブキュー）: 動画変換、CRM 同期、メール送信などの非同期処理

### データベース・ストレージ

- **PostgreSQL** (Amazon RDS / Aurora、東京リージョン): 主要データストア
- **Prisma** または **Drizzle ORM**: TypeScript ネイティブな ORM。Drizzle 推奨（パフォーマンス・型表現力）
- **Redis** (ElastiCache): セッション、キャッシュ、キュー
- **ClickHouse** または **TimescaleDB**: 視聴イベント・インタラクション履歴などの時系列分析データ
- **S3** (東京リージョン): 動画・サムネイル・トランスクリプトなどのオブジェクトストレージ
- **Meilisearch**（kuromoji 形態素解析プラグインを有効化）: 日本語動画タイトル・トランスクリプト全文検索

### 動画ストリーミング

- **Mux** または **AWS MediaConvert + IVS**: 動画エンコード／HLS 配信
  - 日本市場ではデータ主権の観点から AWS 自前運用を優先する
- **HLS.js** + **shaka-player**: ブラウザ側プレイヤー（カスタムプレイヤーを自社実装）
- **CloudFront**（東京エッジ）+ Origin Shield: CDN
  - 必要に応じて **Akamai Japan** や **CDNetworks** を併用検討
- インタラクティブオーバーレイ（フォーム、CTA、ポーリング、クイズ、分岐）は React Portal で動画 timeline と同期させる独自レイヤーを実装

### 認証・認可

- **Auth.js (NextAuth)** をベースに自前構築、または **WorkOS** を SSO/SAML/SCIM のために採用
- パスワード + メール / マジックリンク / Google / Microsoft / SAML SSO（エンタープライズ必須）
- **2FA**（TOTP、WebAuthn）対応
- **RBAC**（ワークスペース → ユーザーロール: Owner / Admin / Editor / Viewer）

### リアルタイム通信

- **Soketi**（self-hosted Pusher 互換）または **Ably**: 動画内 Q&A、ライブ通知、コラボ機能用 WebSocket
- 視聴イベントの取り込みは **Server-Sent Events** または **WebSocket** で配信者ダッシュボードにリアルタイム反映

### CRM・外部連携（日本市場最適化）

- **Salesforce** REST/Bulk API
- **HubSpot** API（日本リージョンの API エンドポイント設定に注意）
- **kintone** API: **第一級の連携対象**（日本国内シェアが極めて高い）
- **Microsoft Dynamics 365** API
- **Sansan** / **HubSpot CRM 日本版** との連携も Phase 2 で検討
- **Zapier** + **Make** + **n8n**（self-hosted）: ノーコード連携基盤
- 連携アーキテクチャは個別実装ではなく **iPaaS 風の汎用イベントバス** を内部に持ち、各 CRM はアダプタとして実装

### メール・通知

- **SendGrid**（日本での配信実績・到達率が高い）または **Amazon SES**
- 日本独自のキャリアメール（@docomo.ne.jp、@ezweb.ne.jp、@softbank.ne.jp）への配慮も忘れない
- Slack、Microsoft Teams、Chatwork、LINE WORKS 通知連携（**Chatwork と LINE WORKS は日本必須**）

### 決済

- **Stripe**（JPY、領収書、適格請求書発行事業者番号対応）をデフォルト
- 国内向けに **PAY.JP** または **GMO ペイメントゲートウェイ** をオプション提供
- **請求書払い（30日後など）**を Phase 2 で対応（日本 B2B では必須に近い）

### 分析・モニタリング

- **PostHog** (self-hosted、東京リージョン): プロダクト分析（データ主権を確保）
- **Sentry**: エラートラッキング
- **Datadog** または **New Relic**: APM・インフラ監視
- **OpenTelemetry**: 計装は標準仕様に揃える

### インフラ・デプロイ

- **AWS ap-northeast-1（東京リージョン）** をプライマリ。**データレジデンシー要件**として外に出さない
- **Terraform** + **AWS CDK**（TypeScript）: IaC
- **Kubernetes (EKS)** または **ECS Fargate**: コンテナオーケストレーション
- **Vercel** はランディングページのみ（プロダクト本体は AWS 自前で持つ）
- **GitHub Actions**: CI/CD
- **Cloudflare**: WAF、DDoS 対策、DNS

### セキュリティ・コンプライアンス

- **APPI（個人情報保護法）**準拠を最優先。プライバシーポリシー、同意管理、削除請求の実装
- **ISMS（ISO 27001）** 取得を中期目標に
- **SOC 2 Type II** はグローバル展開時に取得
- **Pマーク**：日本市場でのエンタープライズ営業に有効
- 個人情報を扱うログは秘匿化（PII マスキング）
- 動画コンテンツは S3 SSE-KMS で暗号化、署名付き URL での配信

---

## ディレクトリ構成

```
leadcast/
├── CLAUDE.md
├── docs/
│   └── leadcast_requirements.md
├── apps/
│   ├── web/             # Next.js（配信者ダッシュボード + 視聴者プレイヤー）
│   └── api/             # NestJS / Hono サーバー
├── packages/
│   ├── ui/              # 共通デザインシステム（shadcn/ui ベース）
│   ├── db/              # Drizzle スキーマと migration
│   ├── shared/          # 型定義・ユーティリティ
│   └── video-player/    # カスタム動画プレイヤー
├── infra/               # Terraform / CDK
└── .github/workflows/   # CI/CD
```

モノレポは **Turborepo** または **Nx** で管理する。

---

## コーディング規約

- TypeScript は **strict mode**、`any` 禁止（やむを得ない場合は `unknown` + ナローイング）
- 関数は原則 **Pure**、副作用は明確に分離
- コンポーネントは **Server Component First**、クライアント化は最小限
- フォームは React Hook Form + Zod、サーバー側でも同じ Zod スキーマでバリデーション
- ファイル名は **kebab-case**、コンポーネントは **PascalCase**、変数は **camelCase**
- コミットは **Conventional Commits**（`feat:`, `fix:`, `chore:` など）
- すべての PR に最低 1 つのテスト追加を必須に
- テスト: **Vitest**（ユニット）、**Playwright**（E2E）、**Storybook の play function**（インタラクション）

## 日本語処理の注意点

- 文字列の長さは `length` ではなく `Intl.Segmenter` でグラフェム単位に
- 全角・半角の正規化（NFKC 正規化を入力時に適用）
- ソートは Locale-aware（`Intl.Collator('ja')`）で
- ファイル名にユーザー入力を含める場合は、Windows 禁則文字＋日本語環境固有の問題（NFC/NFD 違い）に注意
- メール本文の改行は CRLF、件名は RFC 2047 に従い MIME エンコード

## エージェント（Claude Code）への指示

- 新規機能を実装する際は、必ず `docs/leadcast_requirements.md` の該当する F-X-Y 要件を参照し、コミットメッセージにも要件番号を含めること
- 日本市場向け機能を実装する際は、本ファイル「日本市場固有の UX 配慮」セクションに従うこと
- 外部 API 統合（CRM、決済等）を追加する際は、必ず `packages/shared/integrations/` 配下にアダプタを実装し、抽象インタフェースに従うこと
- DB スキーマを変更する際は、`packages/db/migrations/` に migration を追加し、ロールバック手順も記載すること
- 動画プレイヤーや視聴者向け UI に変更を加える際は、Storybook での視覚的確認を必須とすること
