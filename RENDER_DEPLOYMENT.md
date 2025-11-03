# Render 部署指南

## 🎯 為什麼選擇 Render？

相比 Vercel：

| 項目 | Vercel 免費版 | Render 免費版 |
|------|--------------|--------------|
| **超時限制** | 10 秒 ❌ | 無限制 ✅ |
| **部署方式** | Serverless | Web Service |
| **冷啟動** | 快 | 較慢 |
| **月免費額度** | 100 GB-Hours | 750 小時 |
| **適合 Assistants API** | 需優化 ⚠️ | 完美 ✅ |

**結論**：Render 免費版更適合 Assistants API！

---

## 📋 前置準備

1. Render 帳號（免費）：https://render.com
2. GitHub/GitLab 帳號
3. 您的代碼已推送到 Git repository
4. OpenAI API Key 和 Assistant ID
5. LINE Channel 設定

---

## 🔧 需要調整的文件

### 1. 移除 Vercel 專用配置

由於 Render 不需要 `vercel.json`，您可以：

**選項 A：保留（推薦）**
```bash
# 不做任何事，vercel.json 不會影響 Render
```

**選項 B：重命名（可選）**
```bash
mv vercel.json vercel.json.backup
```

### 2. 調整超時設定

編輯 `utils/generate-completion.js`：

**當前代碼**（已針對 Vercel 優化）：
```javascript
if (config.VERCEL_ENV) {
  maxAttempts = Math.max(5, config.VERCEL_MAX_DURATION - 3);
}
```

**改為**（Render 友善）：
```javascript
if (config.VERCEL_ENV) {
  // Vercel 環境：使用較短超時
  maxAttempts = Math.max(5, config.VERCEL_MAX_DURATION - 3);
} else if (config.RENDER) {
  // Render 環境：可以使用更長超時
  maxAttempts = 60; // 60 秒
} else {
  // 本地開發：30 秒默認
  maxAttempts = 30;
}
```

### 3. 添加 Render 環境偵測

編輯 `config/index.js`，添加：

```javascript
// Render 環境偵測
RENDER: env.RENDER || null,
RENDER_SERVICE_NAME: env.RENDER_SERVICE_NAME || null,
```

---

## 🚀 部署步驟

### 步驟 1：創建 Web Service

1. 登入 https://dashboard.render.com
2. 點擊 **New +** → **Web Service**
3. 連接您的 Git repository
4. 選擇您的專案

### 步驟 2：配置 Web Service

#### Basic Settings
```
Name: gpt-ai-assistant（或您喜歡的名稱）
Region: Singapore（或離您最近的）
Branch: main（或您的主分支）
```

#### Build & Deploy
```
Runtime: Node
Build Command: npm install
Start Command: npm start
```

#### Instance Type
```
Free
```

### 步驟 3：設定環境變數

在 Render Dashboard → Environment Variables 添加：

```env
# Node 環境
NODE_ENV=production

# OpenAI 設定
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com

# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# 應用設定
BOT_NAME=AI
APP_LANG=zh_TW
APP_ENV=production

# Render 不需要設定 VERCEL_MAX_DURATION
# 系統會自動使用更長的超時時間
```

### 步驟 4：部署

點擊 **Create Web Service**

Render 會自動：
1. 拉取代碼
2. 安裝依賴
3. 啟動服務

等待幾分鐘，直到看到 "Live" 綠色標籤。

### 步驟 5：獲取 Webhook URL

部署完成後，您會看到：
```
https://your-app-name.onrender.com
```

您的 Webhook URL 是：
```
https://your-app-name.onrender.com/webhook
```

### 步驟 6：設定 LINE Webhook

1. 前往 LINE Developers Console
2. 選擇您的 Channel → Messaging API
3. 設定 Webhook URL：
   ```
   https://your-app-name.onrender.com/webhook
   ```
4. 啟用 Webhook

---

## 📝 建議的代碼調整

### 1. 更新 `config/index.js`

```javascript
const config = Object.freeze({
  // ... 其他配置 ...
  
  // Render 環境偵測
  RENDER: env.RENDER || null,
  RENDER_SERVICE_NAME: env.RENDER_SERVICE_NAME || null,
  
  // Vercel 配置（保留，以防未來需要）
  VERCEL_ENV: env.VERCEL_ENV || null,
  VERCEL_MAX_DURATION: Number(env.VERCEL_MAX_DURATION) || 60,
  
  // ... 其他配置 ...
});
```

### 2. 更新 `utils/generate-completion.js`

```javascript
const waitForRunCompletion = async (threadId, runId, maxAttempts = null) => {
  if (!maxAttempts) {
    if (config.VERCEL_ENV) {
      // Vercel 環境：受限於 maxDuration
      maxAttempts = Math.max(5, config.VERCEL_MAX_DURATION - 3);
      console.log(`[Vercel] Using ${maxAttempts}s timeout`);
    } else if (config.RENDER) {
      // Render 環境：可以使用更長超時
      maxAttempts = 60;
      console.log(`[Render] Using ${maxAttempts}s timeout`);
    } else {
      // 本地環境
      maxAttempts = 30;
      console.log(`[Local] Using ${maxAttempts}s timeout`);
    }
  }
  
  // ... 其他代碼 ...
};
```

### 3. 更新錯誤訊息

```javascript
// 在超時錯誤處理中
if (config.VERCEL_ENV) {
  throw new Error(
    `Assistant 回應時間過長（超過 ${maxAttempts} 秒）。\n` +
    `建議：使用更快的模型或升級到 Vercel Pro`
  );
} else if (config.RENDER) {
  throw new Error(
    `Assistant 回應時間過長（超過 ${maxAttempts} 秒）。\n` +
    `這可能表示 Assistant 遇到了問題，請檢查 OpenAI Platform 的日誌。`
  );
} else {
  throw new Error(`Assistant run timeout: No response after ${maxAttempts} seconds`);
}
```

---

## ⚙️ Render 特定優化

### 1. 避免冷啟動睡眠

Render 免費版會在 15 分鐘無活動後睡眠。

**解決方案 A：使用 Cron Job（推薦）**

在 Render Dashboard：
1. 創建 Cron Job
2. 設定：
   ```
   Schedule: */10 * * * * (每 10 分鐘)
   Command: curl https://your-app-name.onrender.com/health
   ```

**解決方案 B：添加健康檢查端點**

編輯 `api/index.js`，添加：
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});
```

### 2. 調整 Node.js 版本

創建 `.node-version` 文件（如果沒有）：
```
18.17.0
```

或在 `package.json` 中指定：
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3. 優化記憶體使用

Render 免費版有 512MB RAM 限制。

在 `package.json` 的 `start` script 中：
```json
{
  "scripts": {
    "start": "node --max-old-space-size=460 api/index.js"
  }
}
```

---

## 🔍 部署後檢查

### 1. 檢查服務狀態
```
Render Dashboard → Your Service
狀態應該顯示 "Live" 綠色標籤
```

### 2. 查看日誌
```
Render Dashboard → Logs
```

應該看到：
```
Server is running on port 10000
[Render] Using 60s timeout
```

### 3. 測試健康檢查
```bash
curl https://your-app-name.onrender.com/health
```

應該返回：
```json
{"status":"ok","timestamp":"2025-11-03T..."}
```

### 4. 測試 Webhook
在 LINE 發送訊息，應該正常收到回覆。

---

## 📊 Render vs Vercel 比較

### 使用 Assistants API 的體驗

| 功能 | Vercel 免費 | Render 免費 |
|------|------------|------------|
| Assistant 模型選擇 | 僅 mini ⚠️ | 任意 ✅ |
| Code Interpreter | 不可用 ❌ | 可用 ✅ |
| File Search | 不可用 ❌ | 可用 ✅ |
| 複雜查詢 | 需優化 ⚠️ | 無限制 ✅ |
| Instructions 長度 | < 100 字 ⚠️ | 無限制 ✅ |
| 冷啟動 | 極快 ✅ | 較慢 ⚠️ |
| 月成本 | $0 | $0 |

### 建議

**使用 Vercel（優化版）如果**：
- 需要極快的冷啟動
- 只做簡單對話
- 願意優化 Assistant

**使用 Render 如果**：
- 需要 Code Interpreter 或 File Search
- 需要處理複雜查詢
- 不想限制 Assistant 功能

---

## 🎯 混合部署策略

您甚至可以同時使用兩個平台：

```
簡單查詢 → Vercel（快速回應）
複雜查詢 → Render（功能完整）
```

實現方式：
1. 部署兩個相同的應用
2. 根據查詢類型路由到不同 Webhook
3. 或者在代碼中檢測並給出提示

---

## ⚠️ 常見問題

### 1. 服務睡眠（冷啟動慢）

**症狀**：15 分鐘無活動後，首次回應很慢（15-30 秒）

**解決方案**：
- 使用 Cron Job 定期喚醒
- 或升級到 Render Starter ($7/月) 避免睡眠

### 2. RAM 限制

**症狀**：服務崩潰或重啟

**解決方案**：
```javascript
// 優化 Node.js 記憶體
node --max-old-space-size=460 api/index.js
```

### 3. 部署失敗

**檢查**：
- `package.json` 中的 `start` script 是否正確
- Node.js 版本是否兼容
- 環境變數是否設定完整

---

## 💰 成本比較

### Render 方案

| 方案 | 成本 | 優勢 |
|------|------|------|
| **Free** | $0/月 | 750 小時，無超時限制 |
| **Starter** | $7/月 | 無睡眠，優先支援 |
| **Standard** | $25/月 | 更多資源，自動擴展 |

### 建議

**開發/測試**：Free（完全夠用）  
**生產環境**：Starter（$7/月，避免冷啟動）  
**高流量**：Standard（$25/月）

---

## ✅ 遷移檢查清單

### 準備階段
- [ ] 創建 Render 帳號
- [ ] 代碼推送到 Git
- [ ] 準備好環境變數

### 代碼調整
- [ ] 更新 `config/index.js` 添加 RENDER 偵測
- [ ] 更新 `utils/generate-completion.js` 超時邏輯
- [ ] 添加 `/health` 端點（可選）
- [ ] 更新 `.node-version` 文件

### 部署
- [ ] 創建 Render Web Service
- [ ] 設定環境變數
- [ ] 等待部署完成
- [ ] 獲取 Webhook URL

### 測試
- [ ] 測試健康檢查端點
- [ ] 更新 LINE Webhook URL
- [ ] 發送測試訊息
- [ ] 檢查回應正常
- [ ] 查看日誌無錯誤

### 優化（可選）
- [ ] 設定 Cron Job 避免睡眠
- [ ] 優化記憶體使用
- [ ] 監控效能

---

## 🔄 從 Vercel 遷移到 Render

### 快速遷移步驟

```bash
# 1. 更新代碼（見上方建議的調整）
git add .
git commit -m "Add Render support"
git push

# 2. 在 Render 創建 Web Service（見部署步驟）

# 3. 測試 Render 版本正常運作

# 4. 更新 LINE Webhook URL

# 5. （可選）停用或刪除 Vercel 部署
```

### 同時保留兩個平台

```bash
# Vercel：保持現有部署
https://your-app.vercel.app/webhook

# Render：新部署
https://your-app.onrender.com/webhook

# 根據需要切換 LINE Webhook URL
```

---

## 📚 相關資源

- Render 文檔：https://render.com/docs
- Render 社群：https://community.render.com
- Node.js 最佳實踐：https://render.com/docs/node-version

### 本專案文檔
- `VERCEL_DEPLOYMENT.md` - Vercel 部署
- `VERCEL_FREE_OPTIMIZATION.md` - Vercel 優化
- `TROUBLESHOOTING.md` - 疑難排解

---

## 🎉 完成！

完成 Render 部署後，您將享有：
- ✅ 無超時限制（可使用任何模型）
- ✅ 完整的 Assistant 功能（Code Interpreter, File Search）
- ✅ 無需優化 Instructions
- ✅ 完全免費（750 小時/月）

唯一的權衡：冷啟動較慢（可透過 Cron Job 或升級解決）

**推薦**：先用 Render 免費版，如果滿意再考慮升級到 Starter ($7/月) 以獲得更好的體驗！

