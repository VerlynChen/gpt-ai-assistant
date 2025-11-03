# GPT Assistant API 設定指南

本專案已完全替換為使用 OpenAI Assistants API。以下是設定指南。

## 必要的環境變數

在您的 `.env` 文件中，請確保設定以下變數：

### 1. OpenAI API Key
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. GPT Assistant ID (重要！)
這是您在 OpenAI Platform 上創建的 Assistant ID：
```env
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 其他必要設定
```env
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# 應用程式設定
BOT_NAME=AI
APP_LANG=zh_TW
```

## 如何獲取 Assistant ID

1. 登入 [OpenAI Platform](https://platform.openai.com/assistants)
2. 進入 **Assistants** 頁面
3. 創建或選擇一個現有的 Assistant
4. 複製 Assistant ID（格式：`asst_xxxxxxxxxxxx`）
5. 將 ID 設定到環境變數 `OPENAI_ASSISTANT_ID`

### 配置 Assistant（重要）

在 OpenAI Platform 上配置您的 Assistant：

#### 基本設定
- **Model**: 選擇適合的模型（建議 `gpt-4o` 或 `gpt-4o-mini`）
- **Instructions**: 設定 Assistant 的系統提示詞和行為
- **Name**: 給 Assistant 一個名稱（選填）

#### 工具設定（可選）
- ☑️ **Code Interpreter** - 讓 Assistant 可以執行 Python 代碼
- ☑️ **File Search** - 讓 Assistant 可以搜尋上傳的文件
- ☑️ **Function** - 自定義函數（需要額外開發支援）

配置完成後，系統會自動使用這些設定。

## 主要變更說明

### 與 Chat Completions API 的差異

1. **對話記憶管理**
   - 舊版：使用本地 prompt 和 history 管理對話
   - 新版：使用 OpenAI Threads API，每個用戶/群組會自動獲得一個 thread ID

2. **對話歷史**
   - Thread 會自動保存在 OpenAI 端
   - 當用戶使用 "忘記" 指令時，會清除 thread ID 並在下次創建新的 thread

3. **回應生成**
   - 使用輪詢機制等待 Assistant 完成回應（最多 30 秒）
   - 支持 Assistant 的所有功能（如 Code Interpreter、Function Calling 等）

## 功能測試

設定完成後，您可以在 LINE 上測試以下功能：

1. **基本對話** - 直接發送訊息給 bot
2. **繼續對話** - 使用繼續指令讓 bot 繼續回應
3. **忘記對話** - 使用忘記指令清除對話歷史（會創建新 thread）
4. **重試** - 重新生成上一個回應
5. **搜尋** - 使用搜尋指令（需要配置 SERPAPI_API_KEY）

## 疑難排解

### 錯誤：OPENAI_ASSISTANT_ID is not configured
- 請確認 `.env` 文件中已設定 `OPENAI_ASSISTANT_ID`
- 檢查 Assistant ID 格式是否正確（應以 `asst_` 開頭）

### 錯誤：Run timeout
- Assistant 回應超過 30 秒
- 可能是 Assistant 配置的模型回應較慢，或任務較複雜
- 檢查 Assistant 設定，確保使用適當的模型

### 對話記憶問題
- 每個用戶/群組會維護自己的 thread
- 使用 "忘記" 指令會刪除 OpenAI 端的 thread 並重新開始
- Thread 資料儲存在 OpenAI 端，不會因為應用重啟而遺失

### API 版本
- ✅ 本專案使用 **Assistants API v2**
- ✅ 包含所有 v2 新功能和最佳實踐
- 📚 詳細的遷移資訊請參考 `ASSISTANTS_API_V2_MIGRATION.md`

## 技術細節

### 修改的檔案
1. `config/index.js` - 新增 OPENAI_ASSISTANT_ID 配置
2. `services/openai.js` - 新增 Assistants API 方法，包含必要的 `OpenAI-Beta: assistants=v2` header
3. `utils/generate-completion.js` - 完全重寫為使用 Assistant API
4. `app/models/source.js` - 新增 threadId 欄位
5. `app/handlers/*.js` - 更新所有 handlers 以傳遞和保存 threadId

### Assistants API v2
所有 Assistants API 請求都需要包含以下 header：
```
OpenAI-Beta: assistants=v2
```
這已經在 `services/openai.js` 中自動處理。

### Thread 管理邏輯
- 首次對話時自動創建新 thread
- Thread ID 儲存在 source 物件中
- 使用 "忘記" 指令時清除 thread ID
- 下次對話會自動創建新 thread

