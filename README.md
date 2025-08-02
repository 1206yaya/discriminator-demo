# OpenAPI Golang TypeScript Demo

このプロジェクトは、OpenAPIスキーマからGoとTypeScriptのコードを自動生成するデモプロジェクトです。

## プロジェクト構成

```
openapi-golang-typescript/
├── app/                    # Goバックエンド
│   ├── main.go            # メインサーバーファイル
│   ├── go.mod             # Go依存関係
│   └── handlers/http/oapi/ # 生成されるAPIハンドラー
├── front/                  # TypeScriptフロントエンド
│   ├── src/
│   │   ├── adapters/gen/  # 生成されるAPIクライアント
│   │   ├── App.tsx        # メインアプリコンポーネント
│   │   └── main.tsx       # エントリーポイント
│   ├── package.json       # フロントエンド依存関係
│   └── vite.config.ts     # Vite設定
└── schema/                 # OpenAPIスキーマとツール
    ├── openapi.yaml       # OpenAPI仕様
    ├── Makefile           # コード生成コマンド
    ├── oapi-codegen/      # Go用設定
    └── templates/         # TypeScript生成用テンプレート
```

## 使用方法

### 1. 必要なツールのインストール

- Go 1.21以上
- Node.js 18以上
- Docker（OpenAPIコード生成用）
- oapi-codegen（Go用）

```bash
# oapi-codegenのインストール
go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@latest
```

### 2. 依存関係のセットアップ

```bash
make setup
```

### 3. コード生成

```bash
make gen
```

このコマンドは以下を実行します：
- TypeScript Axiosクライアントの生成（`front/src/adapters/gen/`）
- Go APIハンドラーの生成（`app/handlers/http/oapi/`）
- Go OpenAPIスペックの埋め込み

### 4. 開発サーバーの起動

#### バックエンドのみ起動
```bash
make dev-backend
```
サーバーは `http://localhost:3000` で起動します。

#### フロントエンドのみ起動
```bash
make dev-frontend
```
フロントエンドは `http://localhost:3001` で起動します（ポートが使用中の場合は自動的に次のポートを使用）。

#### 両方同時に起動
```bash
make dev
```

### 5. APIのテスト

```bash
make test-api
```

### 6. ビルド

```bash
make build
```

## API エンドポイント

- `GET /api/examples/hello` - Hello Worldメッセージ
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `GET /api/users/{id}` - ユーザー詳細取得
- `PUT /api/users/{id}` - ユーザー更新
- `DELETE /api/users/{id}` - ユーザー削除

## その他のコマンド

### 利用可能なMakeコマンド

```bash
make help  # 全コマンドの表示
```

#### 開発関連
- `make dev-backend` - Goバックエンドサーバーを起動
- `make dev-frontend` - フロントエンド開発サーバーを起動  
- `make dev` - バックエンドとフロントエンドを同時起動
- `make setup` - 依存関係をインストール

#### ビルド関連
- `make build-backend` - Goバックエンドをビルド
- `make build-frontend` - フロントエンドをプロダクション用ビルド
- `make build` - 両方をビルド

#### コード生成関連
- `make gen` - OpenAPIスキーマからコード生成

#### ドキュメント関連
- `make doc` - OpenAPIドキュメント（HTML）を生成（※パスに日本語が含まれる場合は失敗する可能性があります）

#### テスト関連
- `make test-api` - APIエンドポイントをテスト

#### リント・フォーマット関連
- `make lint` - 全てのリントを実行
- `make lint-cli` - OpenAPIスキーマをリント
- `make lint-format` - OpenAPIスキーマのフォーマットをチェック
- `make format` - OpenAPIスキーマをフォーマット

#### クリーンアップ関連
- `make clean` - ビルド成果物を削除

### OpenAPIドキュメントの生成

```bash
make doc
```

### OpenAPIスキーマのリント

```bash
make lint
```

### OpenAPIスキーマのフォーマット

```bash
make format
```

## 技術スタック

- **バックエンド**: Go, Chi Router, oapi-codegen
- **フロントエンド**: React, TypeScript, Vite, Axios
- **コード生成**: OpenAPI Generator, oapi-codegen
- **API仕様**: OpenAPI 3.0

## カスタマイズ

1. `schema/openapi.yaml` でAPI仕様を編集
2. `make gen` でコードを再生成
3. `app/main.go` でビジネスロジックを実装
4. `front/src/App.tsx` でUIを実装
