# Vercel 部署指南

## 🚀 快速部署

### 前置需求
- Vercel 帳號（免費或 Pro）
- GitHub/GitLab/Bitbucket 帳號
- OpenAI API Key
- OpenAI Assistant ID
- LINE Channel 設定

---

## ⚡ 超時設定（重要！）

### Vercel 方案對比

| 方案 | maxDuration 限制 | 建議設定 |
|------|------------------|----------|
| **Hobby (免費)** | 10 秒 | 不建議（Assistant API 需要更長時間）|
| **Pro** | 60 秒 | ✅ 推薦 |
| **Enterprise** | 900 秒 | ✅ 推薦 |

### 當前配置

`vercel.json` 已設定為：
```json
{
  "functions": {
    "api/**/*": {
      "maxDuration": 60
    }
  }
}
```

**注意**：
- ✅ **Pro 版用戶**：可以直接使用 60 秒設定
- ⚠️ **免費版用戶**：需要改為 10 秒，但可能導致超時

---

## 🔧 免費版優化方案

如果您使用 Vercel 免費版，請執行以下優化：

### 1. 修改 vercel.json
```json
{
  "functions": {
    "api/**/*": {
      "maxDuration": 10
    }
  }
}
```

### 2. 設定環境變數
在 Vercel Dashboard 中添加：
```env
VERCEL_MAX_DURATION=10
```

### 3. 優化 Assistant 設定

#### 使用最快的模型
在 OpenAI Platform 上：
- ✅ 使用 `gpt-4o-mini`（最快）
- ❌ 避免 `gpt-4-turbo`（較慢）

#### 簡化 Instructions
```
❌ 過於複雜：
你是一個專業的婚禮顧問，需要提供詳細的建議，包含預算分析、
時程規劃、場地評估、供應商推薦...（300+ 字）

✅ 簡潔有效：
你是婚禮顧問助手，提供簡潔實用的建議。
```

#### 停用耗時工具
- ❌ Code Interpreter（較慢）
- ❌ File Search（較慢）
- ✅ 純文字對話（最快）

---

## 📝 環境變數設定

### 必要變數

在 Vercel Dashboard → Settings → Environment Variables 添加：

```env
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
```

### 可選變數（優化用）

```env
# Vercel 超時設定（Pro 用戶）
VERCEL_MAX_DURATION=60

# 錯誤處理
ERROR_MESSAGE_DISABLED=false

# Bot 行為
BOT_DEACTIVATED=false
BOT_TONE=friendly
```

---

## 🎯 部署步驟

### 方法 1：通過 Vercel Dashboard

1. **連接 Git Repository**
   ```
   Vercel Dashboard → New Project → Import Git Repository
   ```

2. **配置專案**
   - Framework Preset: `Other`
   - Build Command: 留空
   - Output Directory: 留空
   - Install Command: `npm install`

3. **設定環境變數**
   - 添加所有必要的環境變數（見上方）

4. **部署**
   - 點擊 `Deploy`
   - 等待部署完成

### 方法 2：通過 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel

# 部署到生產環境
vercel --prod
```

---

## 🔍 部署後檢查

### 1. 檢查部署狀態
```
Vercel Dashboard → Your Project → Deployments
```

### 2. 檢查函數日誌
```
Vercel Dashboard → Your Project → Functions → View Logs
```

### 3. 測試 Webhook
```bash
curl -X POST https://your-app.vercel.app/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 4. 設定 LINE Webhook
```
LINE Developers Console → Your Channel → Messaging API
Webhook URL: https://your-app.vercel.app/webhook
```

---

## ⚠️ 常見問題

### 1. "Task timed out after 10 seconds"

**原因**：Vercel 免費版限制 10 秒

**解決方案**：

**選項 A：升級到 Pro（推薦）**
- 費用：$20/月
- 支援 60 秒超時
- 更好的效能

**選項 B：優化免費版使用**
```env
# 設定環境變數
VERCEL_MAX_DURATION=10
```
然後優化 Assistant（見上方「免費版優化方案」）

**選項 C：使用其他平台**
- Heroku（免費版已停止）
- Railway（有免費額度）
- 自架伺服器

### 2. "Function Exceeded Maximum Size"

**原因**：依賴套件太大

**解決方案**：
```bash
# 清理 node_modules
rm -rf node_modules
npm install --production
```

### 3. 環境變數沒有生效

**解決方案**：
1. 檢查變數名稱是否正確
2. 重新部署（環境變數更改後需要重新部署）
```bash
vercel --prod
```

### 4. LINE Webhook 驗證失敗

**原因**：Webhook URL 不正確或簽名驗證失敗

**解決方案**：
1. 確認 Webhook URL：`https://your-app.vercel.app/webhook`
2. 檢查 `LINE_CHANNEL_SECRET` 是否正確
3. 查看 Vercel 日誌排查問題

---

## 📊 效能監控

### Vercel Analytics

啟用 Vercel Analytics：
```
Dashboard → Your Project → Analytics
```

監控指標：
- 回應時間
- 錯誤率
- 流量統計

### 自訂監控

在代碼中添加：
```javascript
// 記錄執行時間
const startTime = Date.now();
// ... 你的代碼
const duration = Date.now() - startTime;
console.log(`Execution time: ${duration}ms`);
```

---

## 💡 最佳實踐

### 1. 使用 Pro 版本
對於生產環境，強烈建議使用 Vercel Pro：
- ✅ 60 秒超時足夠 Assistant API
- ✅ 更好的效能
- ✅ 更多並發請求
- ✅ 優先支援

### 2. 監控成本

**OpenAI 成本**：
```
gpt-4o-mini: $0.15/1M input tokens
gpt-4o:      $2.50/1M input tokens
```

**Vercel 成本**：
```
Hobby: $0/月（有限制）
Pro:   $20/月（推薦）
```

### 3. 快取策略

對於重複的查詢，考慮實施快取：
```javascript
// 簡單的記憶快取
const cache = new Map();
const cacheKey = `${userId}:${message}`;
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 4. 錯誤處理

確保良好的錯誤處理：
```javascript
try {
  // Assistant API 調用
} catch (err) {
  console.error('Error:', err);
  // 返回友善的錯誤訊息
  return '抱歉，目前無法處理您的請求，請稍後再試。';
}
```

---

## 🔄 更新部署

### 自動部署
當你推送代碼到 Git 時，Vercel 會自動部署：
```bash
git add .
git commit -m "Update"
git push
```

### 手動部署
```bash
vercel --prod
```

### 回滾
如果部署出問題：
```
Dashboard → Deployments → 選擇舊版本 → Promote to Production
```

---

## 📈 擴展建議

### 當流量增長時

1. **升級到 Pro 或 Enterprise**
2. **使用 Vercel Edge Functions**（更快的冷啟動）
3. **實施速率限制**
4. **添加快取層**
5. **監控和警報**

---

## 🆘 獲取幫助

- Vercel 文檔：https://vercel.com/docs
- Vercel 社群：https://github.com/vercel/vercel/discussions
- 本專案文檔：
  - `TROUBLESHOOTING.md` - 疑難排解
  - `QUICK_START_V2.md` - 快速開始
  - `ASSISTANT_SETUP.md` - Assistant 設定

---

## ✅ 檢查清單

部署前確認：
- [ ] 已設定所有必要的環境變數
- [ ] 已創建 OpenAI Assistant
- [ ] 已設定 LINE Channel
- [ ] vercel.json 的 maxDuration 符合您的方案
- [ ] 已測試 Assistant 回應時間 < maxDuration

部署後確認：
- [ ] 部署成功（綠色勾勾）
- [ ] 環境變數已生效
- [ ] Webhook URL 已設定到 LINE
- [ ] 測試發送訊息正常運作
- [ ] 檢查日誌無錯誤

---

**建議**：對於使用 Assistants API 的應用，強烈建議升級到 Vercel Pro（$20/月），以獲得 60 秒超時支援。這能確保 Assistant 有足夠時間回應，避免超時問題。

