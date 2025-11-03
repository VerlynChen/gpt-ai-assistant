# GPT Assistant API v2 整合 - 修改摘要

## 概述
本次更新將系統從 OpenAI Chat Completions API 完全替換為 **Assistants API v2**，並遵循所有 v2 最佳實踐。

## 修改的檔案清單

### 1. 配置檔案
- ✅ `config/index.js`
  - 新增 `OPENAI_ASSISTANT_ID` 環境變數配置

### 2. 服務層
- ✅ `services/openai.js`
  - **v2 API Header**: 所有請求包含 `OpenAI-Beta: assistants=v2`
  - 新增 `createThread()` - 創建對話線程
  - 新增 `createThreadMessage()` - 發送消息到線程
  - 新增 `createThreadRun()` - 運行 Assistant
  - 新增 `retrieveThreadRun()` - 檢查運行狀態
  - 新增 `listThreadMessages()` - 獲取回覆消息
  - 新增 `cancelThreadRun()` - 取消運行
  - 新增 `deleteThread()` - **v2 最佳實踐**：刪除 thread
  - 新增 `submitToolOutputs()` - **v2 功能**：提交工具輸出（function calling）

### 3. 工具層
- ✅ `utils/generate-completion.js`
  - 完全重寫為使用 Assistants API v2
  - **v2 狀態處理**: 支援所有 v2 run 狀態（含 `incomplete`）
  - **v2 錯誤處理**: 詳細的 `last_error` 和 `incomplete_details`
  - **v2 annotations**: 預留文件引用和註釋處理
  - 新增 `waitForRunCompletion()` 函數（智能輪詢機制）
  - Completion 類新增 `threadId` 屬性
  - 支援傳入現有 threadId 或自動創建新 thread
  - 驗證消息角色和內容

### 4. 模型層
- ✅ `app/models/source.js`
  - Source 類新增 `threadId` 屬性
  - 用於保存每個用戶/群組的 thread ID

### 5. 處理器層（全部更新）
- ✅ `app/handlers/talk.js`
  - 傳遞 threadId 給 generateCompletion
  - 保存返回的 threadId 到 source
  
- ✅ `app/handlers/enquire.js`
  - 同上
  
- ✅ `app/handlers/continue.js`
  - 同上
  
- ✅ `app/handlers/retry.js`
  - 同上
  
- ✅ `app/handlers/search.js`
  - 同上
  
- ✅ `app/handlers/forget.js`
  - **v2 最佳實踐**: 刪除 OpenAI 端的 thread
  - 清除本地 threadId 的邏輯
  - 確保下次對話會創建新 thread
  - 避免無用 thread 累積

### 6. 文檔
- ✅ `ASSISTANT_SETUP.md` - 詳細設定指南（已更新 v2 資訊）
- ✅ `ASSISTANTS_API_V2_MIGRATION.md` - **新增**: v2 遷移完整報告
- ✅ `QUICK_START_V2.md` - **新增**: v2 快速開始指南
- ✅ `CHANGES_SUMMARY.md` - 本文件

## 核心邏輯變更

### 對話流程（舊 vs 新）

#### 舊版（Chat Completions API）
```
用戶發送消息 
  → 從本地讀取 prompt history
  → 調用 Chat Completions API
  → 立即返回完整回應
  → 保存到本地 history
```

#### 新版（Assistants API）
```
用戶發送消息
  → 檢查是否有現有 thread ID
  → 如無則創建新 thread
  → 向 thread 添加消息
  → 運行 assistant
  → 輪詢檢查完成狀態（最多30秒）
  → 獲取 assistant 回應
  → 保存 thread ID 到 source
```

### Thread 生命週期

1. **創建**：當用戶首次對話或 threadId 為 null 時自動創建
2. **維護**：每次對話都會重用同一個 thread，保持對話連續性
3. **清除**：當用戶使用"忘記"指令時，threadId 被設為 null
4. **重建**：清除後的下次對話會創建新 thread

## 環境變數需求

### 新增的必要變數
```env
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx
```

### 保持不變的變數
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxx
LINE_CHANNEL_SECRET=xxxxxxxxxxxx
```

## 優勢

1. **更好的對話管理**
   - OpenAI 端自動管理對話歷史
   - 不需要擔心 token 限制和本地存儲

2. **支援進階功能**
   - Code Interpreter
   - Knowledge Retrieval
   - Function Calling
   - 可在 OpenAI Platform 上配置 Assistant 行為

3. **更好的持久性**
   - 對話歷史存儲在 OpenAI
   - 應用重啟不會丟失對話上下文

4. **更容易維護**
   - 簡化了本地的歷史管理邏輯
   - Assistant 配置可在 OpenAI Platform 上調整，無需修改代碼

## 注意事項

1. **超時設置**
   - 默認最多等待 30 秒 Assistant 完成
   - 可在 `utils/generate-completion.js` 中調整 `maxAttempts` 參數

2. **成本考量**
   - Assistants API 的計費方式與 Chat Completions 略有不同
   - 建議查看 [OpenAI Pricing](https://openai.com/pricing)

3. **向後兼容**
   - 舊的對話歷史（本地 history）會保持運作
   - 但新對話會使用 Assistants API 的 thread 系統

## 測試建議

1. 基本對話測試
2. 多輪對話測試（確認 thread 持久性）
3. "忘記"指令測試（確認 thread 清除）
4. 錯誤處理測試（超時、API 錯誤等）
5. 多用戶並發測試

## 未來可能的優化

1. 實作 thread 列表管理
2. 支援手動刪除 OpenAI 端的 thread
3. 添加 thread 使用統計
4. 支援 streaming 回應
5. 實作 function calling 功能

