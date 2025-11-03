# Assistants API v2 快速開始指南

## 🚀 5 分鐘快速設定

### 步驟 1：創建 Assistant
1. 前往 https://platform.openai.com/assistants
2. 點擊 **Create** 創建新 Assistant
3. 配置：
   ```
   Model: gpt-4o-mini（經濟實惠）或 gpt-4o（更強大）
   Instructions: 你是一個友善的助手...（自訂）
   Tools: 根據需求選擇
   ```
4. 複製 Assistant ID（以 `asst_` 開頭）

### 步驟 2：設定環境變數
創建或編輯 `.env` 文件：
```env
# OpenAI 設定（必要）
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_ASSISTANT_ID=asst-xxxxxxxxxxxx

# LINE Bot 設定（必要）
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret

# 其他設定
BOT_NAME=AI
APP_LANG=zh_TW
```

### 步驟 3：測試
```bash
npm install
npm start
```

在 LINE 上發送訊息給您的 bot，應該會收到回應！

## 📱 LINE Bot 指令

| 指令 | 說明 |
|------|------|
| 直接發送訊息 | 與 Assistant 對話 |
| `忘記` | 清除對話記憶，開始新對話 |
| `繼續` | 讓 Assistant 繼續回應 |
| `重試` | 重新生成上一個回應 |

## 🎨 自訂 Assistant

### 設定個性
在 OpenAI Platform 的 Instructions 中設定：
```
你是一個專業的婚禮顧問助手，負責協助新人規劃完美的婚禮。
你的回答應該：
1. 友善且專業
2. 提供實用的建議
3. 考慮預算和時程
4. 使用繁體中文回答
```

### 啟用工具

#### Code Interpreter
讓 Assistant 可以執行計算和數據分析：
- ☑️ 勾選 **Code Interpreter**
- 用途：預算計算、賓客統計等

#### File Search
讓 Assistant 可以搜尋文件：
- ☑️ 勾選 **File Search**
- 上傳相關文件（如場地資訊、菜單等）
- Assistant 會自動引用文件內容

## 🔧 進階設定

### 調整超時時間
編輯 `utils/generate-completion.js`：
```javascript
const waitForRunCompletion = async (threadId, runId, maxAttempts = 60) => {
  // 從 30 秒改為 60 秒
```

### 添加日誌
在 `utils/generate-completion.js` 中添加：
```javascript
console.log('Thread ID:', currentThreadId);
console.log('Run status:', run.status);
```

## 💰 成本控制

### 選擇模型
| 模型 | 速度 | 成本 | 適用場景 |
|------|------|------|----------|
| `gpt-4o-mini` | 快 | 低 | 一般對話 |
| `gpt-4o` | 中 | 中 | 複雜任務 |
| `gpt-4-turbo` | 慢 | 高 | 最高品質 |

### 監控使用量
- 前往 https://platform.openai.com/usage
- 設定使用限制
- 定期檢查 thread 數量

### 清理舊 Threads
本系統會在用戶使用「忘記」指令時自動刪除 thread，避免累積。

## 🐛 常見問題

### Q: 收到 "OPENAI_ASSISTANT_ID is not configured"
**A**: 檢查 `.env` 文件中是否設定了 `OPENAI_ASSISTANT_ID`

### Q: Assistant 回應太慢
**A**: 
1. 檢查 Assistant 使用的模型
2. 考慮從 `gpt-4o` 降級為 `gpt-4o-mini`
3. 增加超時時間

### Q: 對話沒有記憶
**A**:
1. 確認每次對話都使用同一個用戶/群組
2. 檢查 storage 是否正常運作
3. 確認沒有頻繁使用「忘記」指令

### Q: Function calling 不支援
**A**: 目前版本已預留接口，但需要額外開發。請參考 `ASSISTANTS_API_V2_MIGRATION.md` 的未來開發建議。

## 📚 更多資源

- **詳細設定**: `ASSISTANT_SETUP.md`
- **v2 遷移說明**: `ASSISTANTS_API_V2_MIGRATION.md`
- **變更摘要**: `CHANGES_SUMMARY.md`
- **OpenAI 文檔**: https://platform.openai.com/docs/assistants

## 🎯 下一步

1. ✅ 完成基本設定
2. 📝 自訂 Assistant 的 Instructions
3. 🧪 測試不同工具（Code Interpreter, File Search）
4. 📊 監控使用量和成本
5. 🚀 部署到生產環境

---

**需要幫助？** 
- 查看詳細文檔：`ASSISTANT_SETUP.md`
- OpenAI 社群：https://community.openai.com/
- GitHub Issues：（您的專案 GitHub 連結）

