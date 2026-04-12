# MealLog - ご飯専用SNS

## デプロイ手順（Vercel）

### 1. GitHubにアップロード
1. https://github.com にアクセスしてアカウント作成
2. 「New repository」→ 名前を「meallog」にして作成
3. このフォルダをアップロード

### 2. Anthropic APIキーを取得
1. https://console.anthropic.com にアクセス
2. 「API Keys」→「Create Key」でキーを作成
3. `sk-ant-...` で始まるキーをメモしておく

### 3. Vercelにデプロイ
1. https://vercel.com にアクセスしてGitHubでログイン
2. 「Add New Project」→ GitHubのmeallogを選択
3. 「Environment Variables」に以下を追加：
   - Name: `ANTHROPIC_API_KEY`
   - Value: 取得したAPIキー（sk-ant-...）
4. 「Deploy」ボタンを押す
5. 数分後に `https://meallog-xxx.vercel.app` のURLが発行される！

## ローカルで試す場合
```
cp .env.local.example .env.local
# .env.localにAPIキーを入力

npm install
npm run dev
# http://localhost:3000 で確認
```

## 機能
- 📷 写真投稿（AIが食べ物60%以上か自動判定）
- #️⃣ ハッシュタグ（朝/昼/夜ごはん、ラーメン、寿司など）
- 📍 お店の場所登録（名前・住所）
- 🔖 気に入った投稿を保存
- 📍 近くの飲食店を探す（GPS）
- ❤️ いいね機能
