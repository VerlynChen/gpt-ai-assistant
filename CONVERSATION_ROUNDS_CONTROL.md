# 對話輪數控制說明

## 🎯 功能概述

控制 GPT Assistant 的對話輪數，當達到設定的輪數上限時，系統會**自動清理 thread** 並開始新對話。

---

## 📊 為什麼需要對話輪數控制？

### 舊系統 vs 新系統

#### 舊系統（Chat Completions API）
```javascript
APP_MAX_PROMPT_MESSAGES = 4  // 限制為 2 輪對話
```
- ✅ 自動限制對話輪數
- ✅ 超過限制會移除舊訊息
- ✅ 控制 token 使用

#### 新系統（Assistants API）- 未設定前
```
❌ 沒有輪數限制
❌ Thread 累積所有歷史訊息
⚠️ Token 成本隨對話增加
⚠️ 過長的歷史可能影響回應品質
```

---

## ⚙️ 配置方式

### 環境變數

在 `.env` 文件中添加：

```env
# 對話輪數限制（0 = 無限制）
APP_MAX_CONVERSATION_ROUNDS=10
```

### 配置值說明

| 值 | 效果 | 適用場景 |
|---|------|---------|
| `0` | 無限制（預設） | 需要長期記憶的對話 |
| `5` | 5 輪後自動重置 | 快速問答、客服 |
| `10` | 10 輪後自動重置 | 一般對話（推薦） |
| `20` | 20 輪後自動重置 | 深度對話、教學 |
| `50` | 50 輪後自動重置 | 長期對話 |

---

## 🚀 運作原理

### 對話流程

```
用戶發送訊息 1
  ↓ [Round 1/10]
Assistant 回應

用戶發送訊息 2
  ↓ [Round 2/10]
Assistant 回應

... 持續對話 ...

用戶發送訊息 10
  ↓ [Round 10/10]
Assistant 回應

用戶發送訊息 11
  ↓ [自動重置！]
  → 刪除舊 Thread
  → 創建新 Thread
  → Round 1/10
Assistant 回應
```

### 自動清理機制

1. **達到上限時**
   ```javascript
   if (conversationRounds >= maxRounds) {
     // 1. 刪除 OpenAI 端的 thread
     await deleteThread({ threadId });
     
     // 2. 重置本地計數器
     conversationRounds = 0;
     threadId = null;
     
     // 3. 開始新對話
   }
   ```

2. **靜默執行**
   - 用戶**不會**看到「對話已重置」訊息
   - 平滑過渡到新對話
   - 對用戶體驗無感

3. **手動清理**
   - 用戶隨時可點「忘記」按鈕
   - 立即重置對話和計數器

---

## 📋 範例場景

### 場景 1：客服機器人（5 輪）

```env
APP_MAX_CONVERSATION_ROUNDS=5
```

**效果**：
- 用戶問完 5 個問題後自動重置
- 避免累積過多上下文
- 適合獨立的問答場景

**對話範例**：
```
用戶：你們幾點營業？       [1/5]
Bot：我們早上 9 點營業。

用戶：有停車位嗎？         [2/5]
Bot：有，提供免費停車。

用戶：可以刷卡嗎？         [3/5]
Bot：可以，支援所有信用卡。

用戶：有會員制度嗎？       [4/5]
Bot：有，消費滿 1000 即可辦理。

用戶：謝謝！               [5/5]
Bot：不客氣，歡迎光臨！

用戶：另外想問...          [1/5] ← 自動重置
Bot：請問有什麼問題嗎？
```

---

### 場景 2：一般對話（10 輪，推薦）

```env
APP_MAX_CONVERSATION_ROUNDS=10
```

**效果**：
- 平衡記憶和成本
- 適合大多數對話場景
- 推薦的預設值

**對話範例**：
```
對話 1-10：討論婚禮場地
  ↓ [10/10 後自動重置]
對話 11-20：討論婚禮預算（新 thread，不記得之前的場地討論）
```

---

### 場景 3：長期對話（無限制）

```env
APP_MAX_CONVERSATION_ROUNDS=0
```

**效果**：
- 保留所有對話歷史
- Assistant 記得所有內容
- 適合需要長期記憶的場景

**警告**：
- ⚠️ Token 成本會持續累積
- ⚠️ 過長的歷史可能影響回應品質
- ⚠️ 建議搭配 OpenAI 的使用限制

---

## 💡 最佳實踐

### 1. 根據場景選擇輪數

```env
# 快速問答 / 客服
APP_MAX_CONVERSATION_ROUNDS=5

# 一般對話 / 助手（推薦）
APP_MAX_CONVERSATION_ROUNDS=10

# 深度對話 / 教學
APP_MAX_CONVERSATION_ROUNDS=20

# 需要長期記憶
APP_MAX_CONVERSATION_ROUNDS=0
```

### 2. 監控對話輪數

查看 Render 日誌（或本地 console）：

```bash
# 在 Logs 中搜尋
[Conversation] Round 1/10
[Conversation] Round 5/10
[Conversation] Round 10/10
[Conversation] Round limit reached (10), resetting thread...
[Conversation] Round 1/10  ← 新對話
```

### 3. 結合其他優化

```env
# 限制對話輪數
APP_MAX_CONVERSATION_ROUNDS=10

# 使用快速模型（在 OpenAI Platform 設定）
Assistant Model: gpt-4o-mini

# 精簡 Instructions
Instructions: 簡潔、清楚的指示
```

---

## 🔍 技術細節

### 資料結構

#### Source Model
```javascript
class Source {
  threadId;              // OpenAI thread ID
  conversationRounds;    // 當前對話輪數
  // ...
}
```

#### 儲存方式
```javascript
// 每次對話後更新
await updateSources(context.id, (source) => { 
  source.threadId = threadId;
  source.conversationRounds = rounds;
});
```

### 計數邏輯

```javascript
// 每次用戶發送訊息，輪數 +1
conversationRounds += 1;

// 達到上限時重置
if (conversationRounds >= maxRounds) {
  conversationRounds = 0;
  threadId = null;
}

// 手動「忘記」也會重置
if (userClicksForget) {
  conversationRounds = 0;
  threadId = null;
}
```

---

## 📊 成本分析

### 無限制 vs 限制輪數

#### 無限制（APP_MAX_CONVERSATION_ROUNDS=0）

```
對話 1：100 tokens
對話 2：100 + 120 = 220 tokens
對話 3：220 + 150 = 370 tokens
...
對話 50：累積可能超過 10,000 tokens
```

**成本**：持續累積 💰💰💰

#### 限制 10 輪

```
對話 1-10：累積到 ~2,000 tokens
  ↓ [自動重置]
對話 11-20：從 100 tokens 重新開始
```

**成本**：可控制 💰

### 估算公式

```javascript
// 無限制
totalCost = averageTokensPerRound * totalRounds * tokenPrice

// 限制輪數
totalCost = averageTokensPerRound * maxRounds * (totalRounds / maxRounds) * tokenPrice
```

**節省**：根據對話長度，可節省 **30-70% 的 token 成本**！

---

## 🛠️ 故障排除

### Q1: 設定後沒有生效？

**檢查清單**：
1. ✅ 確認 `.env` 文件已更新
2. ✅ 重新部署到 Render
3. ✅ 檢查環境變數是否正確設定

```bash
# Render Dashboard
Settings → Environment
確認 APP_MAX_CONVERSATION_ROUNDS 存在
```

### Q2: 怎麼確認當前輪數？

**查看日誌**：
```bash
# Render Logs
[Conversation] Round 3/10  ← 當前在第 3 輪，上限 10 輪
```

### Q3: 想要更長的記憶怎麼辦？

**選項 1**：增加輪數
```env
APP_MAX_CONVERSATION_ROUNDS=50
```

**選項 2**：使用 OpenAI 的 File Search
- 上傳重要資訊作為文件
- Assistant 可以隨時查詢
- 不受輪數限制

**選項 3**：完全關閉限制
```env
APP_MAX_CONVERSATION_ROUNDS=0
```
⚠️ 注意成本！

### Q4: 重置會刪除所有歷史嗎？

**回答**：
- ✅ 刪除 OpenAI 端的 thread（釋放資源）
- ✅ 重置輪數計數器
- ⚠️ Assistant 不會記得之前的對話
- ℹ️ 本地日誌仍會保留（用於調試）

### Q5: 可以中途修改輪數嗎？

**可以**！隨時修改並部署：

```bash
# 修改 .env
APP_MAX_CONVERSATION_ROUNDS=15  # 從 10 改為 15

# 部署
git add .env
git commit -m "Update conversation rounds limit"
git push

# Render 自動重新部署
```

**效果**：
- ✅ 新對話使用新設定
- ✅ 現有對話繼續使用舊設定直到達到限制

---

## 🎯 推薦設定

### 婚禮助手（範例）

```env
# 一般對話：10 輪
APP_MAX_CONVERSATION_ROUNDS=10

# 其他相關設定
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx

# 在 OpenAI Platform 設定
Model: gpt-4o-mini
Instructions: 
  你是專業的婚禮策劃助手。
  提供簡潔、實用的建議。
  重點關注：場地、預算、流程、供應商推薦。
  
Tools:
  ✅ File Search（上傳場地、供應商資訊）
  ❌ Code Interpreter（不需要）
```

### 客服機器人

```env
# 快速問答：5 輪
APP_MAX_CONVERSATION_ROUNDS=5

Model: gpt-4o-mini
Instructions:
  你是客服助手。
  回答簡潔、友善。
  每個問題獨立處理。
```

### 個人助理

```env
# 較長對話：20 輪
APP_MAX_CONVERSATION_ROUNDS=20

Model: gpt-4o
Instructions:
  你是私人助理。
  記住用戶偏好和習慣。
  提供個性化建議。
```

---

## 📈 監控與分析

### 建議監控指標

1. **平均對話輪數**
   ```bash
   # 分析日誌
   grep "[Conversation] Round" logs.txt | awk '{print $4}'
   ```

2. **重置頻率**
   ```bash
   # 統計重置次數
   grep "Round limit reached" logs.txt | wc -l
   ```

3. **Token 使用量**
   - 在 OpenAI Platform 查看
   - Dashboard → Usage

4. **成本對比**
   - 開啟限制前的日均成本
   - 開啟限制後的日均成本
   - 計算節省比例

---

## ✅ 快速開始

### 1. 設定環境變數

```bash
# .env
APP_MAX_CONVERSATION_ROUNDS=10
```

### 2. 在 Render 設定

```
Dashboard → Environment
Add Environment Variable:
  Key: APP_MAX_CONVERSATION_ROUNDS
  Value: 10
```

### 3. 部署

```bash
git add .
git commit -m "Enable conversation rounds control"
git push
```

### 4. 測試

```
在 LINE 上與 Bot 對話 10 輪
  ↓
查看 Render Logs
  ↓
確認看到：[Conversation] Round limit reached (10), resetting thread...
  ↓
繼續對話，確認 Bot 不記得之前的內容（表示成功重置）
```

---

## 🎉 總結

### 優點

- ✅ **控制成本**：避免 token 無限累積
- ✅ **保持品質**：防止過長歷史影響回應
- ✅ **靈活配置**：可根據場景調整
- ✅ **自動化**：無需手動干預
- ✅ **透明化**：日誌完整記錄

### 適用場景

| 場景 | 推薦輪數 | 原因 |
|------|---------|------|
| 客服 | 5 | 快速、獨立問答 |
| 一般對話 | 10 | 平衡記憶和成本 |
| 深度討論 | 20 | 需要較長上下文 |
| 長期助理 | 0 | 需要完整記憶 |

### 下一步

1. 🎯 根據您的使用場景設定輪數
2. 📊 監控實際使用情況
3. 🔧 根據需求調整
4. 💰 追蹤成本節省效果

---

## 📚 相關文檔

- **`ASSISTANT_SETUP.md`** - Assistant 基本設定
- **`RENDER_DEPLOYMENT.md`** - Render 部署指南
- **`FILE_CITATION_FILTER.md`** - 文件引用過濾
- **`LINE_FORMAT_GUIDE.md`** - LINE 格式轉換

---

現在您已經可以完全控制 GPT Assistant 的對話輪數了！🎊

根據您的需求設定輪數，享受成本可控、品質穩定的對話體驗。



