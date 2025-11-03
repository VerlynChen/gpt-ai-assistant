# 疑難排解指南

## ❌ 常見錯誤及解決方案

### 1. "No message content provided"

#### 症狀
LINE bot 回覆 "No message content provided" 錯誤訊息

#### 原因
這是從舊的 Chat Completions API 遷移到 Assistants API 時的相容性問題。舊系統會調用 `write(ROLE_AI)` 創建空的 assistant 消息作為佔位符，但 Assistants API 不需要這樣做。

#### 解決方案
✅ **已修復**：系統現在會自動跳過空的 AI 消息，只發送實際的用戶消息到 Assistant。

#### 技術細節
- 系統會向後搜尋最後一條非空的用戶消息
- 支援文字和圖片消息
- 自動過濾空白或僅含空格的消息

---

### 2. "OPENAI_ASSISTANT_ID is not configured"

#### 症狀
應用啟動或回應時出現此錯誤

#### 原因
環境變數中未設定 `OPENAI_ASSISTANT_ID`

#### 解決方案
1. 在 `.env` 文件中添加：
```env
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx
```

2. 確認 `config/index.js` 包含此配置項：
```javascript
OPENAI_ASSISTANT_ID: env.OPENAI_ASSISTANT_ID || null,
```

3. 重啟應用

#### 如何獲取 Assistant ID
1. 前往 https://platform.openai.com/assistants
2. 創建或選擇 Assistant
3. 複製 ID（格式：`asst_xxxxxxxxxxxx`）

---

### 3. "Vercel Runtime Timeout Error: Task timed out after 10 seconds"

#### 症狀
在 Vercel 上部署後，收到 10 秒超時錯誤

#### 原因
- Vercel 免費版（Hobby）限制函數執行時間為 10 秒
- Assistants API 需要更長時間來回應（通常 10-30 秒）
- `vercel.json` 的 `maxDuration` 設定不當

#### 解決方案

**✅ 推薦方案：升級到 Vercel Pro**
```
費用：$20/月
支援：60 秒超時
優勢：足夠 Assistants API 使用
```

**方案 B：優化免費版使用**

1. 修改 `vercel.json`：
```json
{
  "functions": {
    "api/**/*": {
      "maxDuration": 10
    }
  }
}
```

2. 設定環境變數：
```env
VERCEL_MAX_DURATION=10
```

3. 在 OpenAI Platform 優化 Assistant：
   - 使用 `gpt-4o-mini`（最快）
   - 簡化 Instructions
   - 停用 Code Interpreter 和 File Search

4. 重新部署：
```bash
vercel --prod
```

**方案 C：使用其他平台**
- Railway（有免費額度）
- 自架伺服器
- 其他支援長時間執行的平台

📚 **詳細指南**：請參考 `VERCEL_DEPLOYMENT.md`

---

### 4. "Run timeout: Assistant took too long to respond"

#### 症狀
等待 30 秒後出現超時錯誤

#### 原因
- Assistant 使用的模型太慢
- Assistant 正在執行複雜任務（如 Code Interpreter）
- API 響應緩慢

#### 解決方案

**方案 1：使用更快的模型**
在 OpenAI Platform 上將 Assistant 的模型改為：
- `gpt-4o-mini`（最快，推薦）
- `gpt-4o`（平衡）

**方案 2：增加超時時間**
編輯 `utils/generate-completion.js`：
```javascript
// 從 30 秒改為 60 秒
const waitForRunCompletion = async (threadId, runId, maxAttempts = 60) => {
```

**方案 3：簡化 Assistant Instructions**
- 減少 instructions 的複雜度
- 避免要求過於詳細的回應

---

### 4. Assistant 沒有記憶/對話不連貫

#### 症狀
- Assistant 似乎不記得之前的對話
- 每次都像是新對話

#### 原因
- Thread ID 沒有正確保存
- Storage 機制有問題
- 頻繁使用「忘記」指令

#### 解決方案

**檢查 Storage**
確認 storage 正常運作：
```javascript
// 檢查 storage/index.js
console.log('Sources:', getSources());
```

**檢查 Thread ID**
在 handlers 中添加日誌：
```javascript
console.log('Current threadId:', context.source.threadId);
```

**確認用戶 ID**
確保每次對話使用相同的用戶/群組 ID

---

### 5. 圖片消息無法處理

#### 症狀
發送圖片後沒有回應或出錯

#### 原因
- Assistant 的模型不支援 vision
- 圖片格式不正確

#### 解決方案

**使用支援 Vision 的模型**
在 OpenAI Platform 上設定：
- `gpt-4o`（支援 vision）
- `gpt-4o-mini`（支援 vision）
- ❌ `gpt-3.5-turbo`（不支援）

**檢查圖片消息格式**
系統會自動處理圖片消息，格式為：
```javascript
[
  { type: 'text', text: '圖片描述' },
  { type: 'image_url', image_url: { url: 'base64...' } }
]
```

---

### 6. "You must provide the 'OpenAI-Beta' header"

#### 症狀
API 請求被拒絕，要求提供 OpenAI-Beta header

#### 原因
這是 Assistants API v2 的必要 header

#### 解決方案
✅ **已修復**：所有 Assistants API 請求已自動包含：
```javascript
'OpenAI-Beta': 'assistants=v2'
```

確認 `services/openai.js` 中有：
```javascript
const assistantsHeaders = {
  'OpenAI-Beta': 'assistants=v2',
};
```

---

### 7. 成本過高

#### 症狀
OpenAI 使用費用增長太快

#### 原因
- 使用昂貴的模型
- Thread 累積過多
- 頻繁的長對話

#### 解決方案

**選擇經濟型模型**
```
gpt-4o-mini     → 便宜 (推薦)
gpt-4o          → 適中
gpt-4-turbo     → 昂貴
```

**定期清理 Threads**
- 提醒用戶使用「忘記」指令
- 系統會自動刪除 OpenAI 端的 thread

**設定使用限制**
在 OpenAI Platform 上：
1. 進入 Settings > Limits
2. 設定每月預算上限
3. 設定使用警報

**監控使用量**
- 前往 https://platform.openai.com/usage
- 查看每日使用量
- 分析哪些功能用量最大

---

### 8. "Assistant run failed" 錯誤

#### 症狀
Run 失敗並顯示錯誤代碼

#### 常見錯誤代碼

**server_error**
- 原因：OpenAI 伺服器問題
- 解決：稍後重試

**rate_limit_exceeded**
- 原因：超過 API 速率限制
- 解決：添加重試邏輯或升級 API tier

**invalid_prompt**
- 原因：消息內容違反政策
- 解決：檢查用戶輸入內容

**context_length_exceeded**
- 原因：對話太長超過模型限制
- 解決：使用「忘記」指令清除歷史

---

## 🔍 診斷步驟

### 1. 檢查環境變數
```bash
# 確認這些變數已設定
echo $OPENAI_API_KEY
echo $OPENAI_ASSISTANT_ID
echo $LINE_CHANNEL_ACCESS_TOKEN
```

### 2. 檢查 Assistant 配置
1. 前往 https://platform.openai.com/assistants
2. 確認 Assistant 存在且已啟用
3. 檢查模型和工具配置

### 3. 查看日誌
```bash
# 啟動應用並查看日誌
npm start

# 查看錯誤訊息
# 特別注意包含 "error" 或 "failed" 的行
```

### 4. 測試 API 連接
```bash
# 測試 OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### 5. 檢查 Storage
```javascript
// 在 console 中檢查
const { getSources } = require('./app/repository/source.js');
console.log(getSources());
```

---

## 🆘 仍然無法解決？

### 收集資訊
1. 錯誤訊息的完整內容
2. 發生錯誤前的操作步驟
3. 環境資訊（Node.js 版本等）
4. 相關的日誌輸出

### 查看文檔
- `QUICK_START_V2.md` - 快速開始
- `ASSISTANT_SETUP.md` - 詳細設定
- `ASSISTANTS_API_V2_MIGRATION.md` - 技術細節

### 社群支援
- OpenAI Community: https://community.openai.com/
- OpenAI Discord: https://discord.gg/openai
- Stack Overflow: 標籤 `openai-api`

### 官方資源
- API Status: https://status.openai.com/
- Documentation: https://platform.openai.com/docs
- Support: https://help.openai.com/

---

## 📝 預防措施

### 定期維護
- 每週檢查一次 OpenAI 使用量
- 定期更新依賴套件
- 備份重要的 Assistant 配置

### 監控
- 設定成本警報
- 監控錯誤率
- 追蹤回應時間

### 最佳實踐
- 使用適當的模型（不要過度使用高級模型）
- 實施速率限制
- 定期清理舊 threads
- 測試後再部署到生產環境

---

**提示**：大多數問題都可以通過檢查環境變數和 Assistant 配置來解決！

