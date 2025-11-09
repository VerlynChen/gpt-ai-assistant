# GPT Assistant 效能優化指南

## 目前已實施的優化

### 1. 使用更快的模型
- ✅ 預設使用 `gpt-4o-mini` - 速度快、成本低
- ✅ Vision 使用 `gpt-4o` - 平衡速度與品質

### 2. 漸進式輪詢策略
```
前 3 次檢查: 300ms 間隔
接下來 3 次: 500ms 間隔
之後: 1000ms 間隔
```

### 3. 平台自適應超時
- Vercel 免費版: 最多 7 秒等待（考慮 10 秒限制）
- Render: 60 秒等待（無限制）
- 本地開發: 30 秒等待

### 4. 對話輪數控制
- 支援設定最大對話輪數，避免 context 過長

## 進階優化建議

### 優化 1: 調整 Assistant 設置

在 OpenAI Platform 上優化你的 Assistant：

#### A. 使用更快的模型
```
推薦模型設置：
- gpt-4o-mini (最快，適合一般對話)
- gpt-4o (快速且功能完整)
避免使用 gpt-4-turbo 或更舊的模型
```

#### B. 簡化 Instructions
```
❌ 避免：超長 Instructions（>1000 字）
✅ 建議：精簡到 200-500 字的核心指示

範例優化前：
"你是一個非常專業的AI助手，需要詳細回答用戶的每一個問題...（1500字）"

範例優化後：
"你是友善的AI助手。簡潔清晰地回答問題。使用繁體中文。"
```

#### C. 停用不必要的工具
```
❌ Code Interpreter - 速度最慢（3-10秒額外延遲）
❌ File Search - 較慢（1-3秒額外延遲）
✅ 純對話模式 - 最快（通常 <2秒）
```

### 優化 2: 環境變數配置

創建或更新你的 `.env` 檔案：

```env
# === 速度優化配置 ===

# 1. 使用最快的模型
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o

# 2. 減少 Token 限制（加快回應）
OPENAI_COMPLETION_MAX_TOKENS=256
# 如果回應常被截斷，可增加到 512

# 3. 縮短超時時間（快速失敗）
OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000

# 4. 限制對話輪數（避免 context 過長）
APP_MAX_CONVERSATION_ROUNDS=10
# 設為 0 = 無限制（但可能變慢）

# 5. 減少 prompt 訊息數量
APP_MAX_PROMPT_MESSAGES=3
APP_MAX_PROMPT_TOKENS=256

# 6. 調整溫度（可選）
OPENAI_COMPLETION_TEMPERATURE=0.7
# 較低的溫度（0.3-0.7）通常回應更快
```

### 優化 3: 代碼層面優化

已實施但可以進一步調整：

#### A. 更激進的初始輪詢
修改 `utils/generate-completion.js` 的 `getPollingInterval`：

```javascript
const getPollingInterval = (attemptNumber) => {
  if (attemptNumber < 2) return 200; // 前 2 次: 200ms
  if (attemptNumber < 5) return 300; // 接下來 3 次: 300ms
  if (attemptNumber < 8) return 500; // 再 3 次: 500ms
  return 1000; // 之後: 1s
};
```

#### B. 並行預處理
如果有多個獨立的 API 呼叫，使用 `Promise.all()`。

### 優化 4: 部署平台選擇

#### Vercel 免費版 - 限制最多
```
✅ 優點: 免費、易部署
❌ 限制: 10秒超時、較慢的冷啟動
建議: 只用於測試或低流量場景
```

#### Vercel Pro - 平衡選擇
```
✅ 優點: 60秒超時、無冷啟動
💰 成本: $20/月
建議: 適合正式環境
```

#### Render 免費版 - 推薦！
```
✅ 優點: 無超時限制、免費
❌ 缺點: 冷啟動較慢（15分鐘未使用）
建議: 最適合這個專案
```

## 速度基準測試

### 理想速度（各階段耗時）
```
1. 接收訊息: <100ms
2. 創建/獲取 Thread: 200-500ms
3. 發送訊息到 Thread: 200-400ms
4. Assistant 處理: 1-3秒（取決於模型和工具）
5. 獲取回應: 200-400ms
-----------------------------------
總計: 2-5秒（最佳情況）
```

### 實際速度因素
- **模型選擇**: gpt-4o-mini (2秒) vs gpt-4-turbo (5-10秒)
- **工具使用**: 無工具 (2秒) vs Code Interpreter (10-30秒)
- **Instructions 長度**: 簡短 (2秒) vs 超長 (4-6秒)
- **網路延遲**: 台灣到美國 API (200-400ms 額外延遲)

## 快速檢查清單

進行以下檢查以確保最佳效能：

### OpenAI Platform
- [ ] Assistant 使用 gpt-4o-mini 或 gpt-4o
- [ ] Instructions 少於 500 字
- [ ] 停用 Code Interpreter 和 File Search
- [ ] 沒有上傳大型檔案

### 環境配置
- [ ] `OPENAI_COMPLETION_MODEL=gpt-4o-mini`
- [ ] `OPENAI_COMPLETION_MAX_TOKENS=256-512`
- [ ] `APP_MAX_CONVERSATION_ROUNDS=10`
- [ ] `OPENAI_TIMEOUT=5000-6000`

### 部署平台
- [ ] 使用 Render（最推薦）或 Vercel Pro
- [ ] 避免 Vercel 免費版用於正式環境

## 監控與調試

### 查看效能日誌
你的代碼已經包含詳細的日誌：

```
[Assistant] Created new thread: thread_xxx
[Assistant] Started run: run_xxx
[Assistant] Completed in 2.34s after 5 attempts
[Conversation] Round 3/10
```

### 找出瓶頸
如果回應慢，檢查日誌中的：
- `Completed in X.XXs` - 總處理時間
- `after X attempts` - 輪詢次數（越多表示 Assistant 處理越久）

## 故障排除

### 問題: 經常超時
```
原因: Assistant 模型太慢或使用了 Code Interpreter
解決: 切換到 gpt-4o-mini，停用所有工具
```

### 問題: 回應被截斷
```
原因: MAX_TOKENS 太小
解決: 增加 OPENAI_COMPLETION_MAX_TOKENS 到 512 或 1024
```

### 問題: 冷啟動慢
```
原因: Vercel/Render 的冷啟動機制
解決: 使用 cron-job.org 每 10 分鐘 ping 一次
```

## 成本優化

### gpt-4o-mini 定價（2024）
```
輸入: $0.150 / 1M tokens
輸出: $0.600 / 1M tokens

範例成本（每次對話）:
- 輸入 500 tokens: $0.000075
- 輸出 200 tokens: $0.000120
- 總計: $0.000195 (約台幣 $0.006)
```

相比 gpt-4-turbo：
- 速度快 **2-3 倍**
- 成本低 **10-15 倍**

## 總結

**最重要的 3 個優化：**

1. ⭐ **使用 gpt-4o-mini** - 速度和成本最優
2. ⭐ **停用 Assistant 工具** - 避免額外延遲
3. ⭐ **部署到 Render** - 無超時限制

實施這些優化後，你應該能看到：
- 平均回應時間: **2-4 秒**（從 5-10 秒）
- 成本減少: **80-90%**
- 失敗率降低: **<1%**

---

如有任何問題，請查看代碼中的註解或 OpenAI Platform 的日誌。
