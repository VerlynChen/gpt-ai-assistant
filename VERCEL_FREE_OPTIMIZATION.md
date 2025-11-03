# Vercel 免費版優化指南

## 🎯 目標
在 Vercel 免費版（10 秒限制）下運行 Assistants API

## ⚡ 當前設定

系統已自動配置為：
- Vercel 超時：10 秒
- Assistant 輪詢：7 秒（預留 3 秒給其他處理）
- 自動環境偵測

---

## 📋 必做優化（重要！）

### 1. 設定 Vercel 環境變數

在 Vercel Dashboard → Settings → Environment Variables 添加：

```env
# 告訴系統 Vercel 的超時限制
VERCEL_MAX_DURATION=10

# 其他必要變數
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
```

### 2. 優化 OpenAI Assistant（關鍵！）

#### ✅ 使用最快的模型
登入 https://platform.openai.com/assistants

**必須選擇**：`gpt-4o-mini`

| 模型 | 回應時間 | 適用性 |
|------|----------|--------|
| gpt-4o-mini | ~2-5 秒 | ✅ 必須使用 |
| gpt-4o | ~5-15 秒 | ❌ 太慢 |
| gpt-4-turbo | ~10-30 秒 | ❌ 太慢 |

#### ✅ 簡化 Instructions

**❌ 不好的例子（太詳細）**：
```
你是一個專業的婚禮顧問助手，擁有豐富的婚禮規劃經驗。
你需要：
1. 提供詳細的預算分析和建議
2. 根據不同季節推薦適合的婚禮場地
3. 協助新人規劃完整的時程表
4. 提供各類供應商的推薦和比較
5. 考慮文化習俗和現代趨勢
6. 給予個性化的建議
... (300+ 字)
```

**✅ 好的例子（簡潔有效）**：
```
你是婚禮顧問助手，用簡潔友善的方式提供實用建議。
回答要點：
1. 簡明扼要
2. 重點突出
3. 使用繁體中文
```

#### ✅ 停用耗時的工具

在 Assistant 設定中：
- ☑️ **不要勾選** Code Interpreter（會執行代碼，很慢）
- ☑️ **不要勾選** File Search（會搜尋文件，很慢）
- ☑️ **不要勾選** Function（需要額外往返）

只使用純文字對話，最快！

### 3. 部署到 Vercel

```bash
# 確認修改已提交
git add .
git commit -m "Optimize for Vercel free tier"
git push

# 或使用 Vercel CLI
vercel --prod
```

---

## 🔍 驗證優化效果

### 測試 Assistant 回應時間

在 OpenAI Playground 測試：
1. 前往 https://platform.openai.com/playground
2. 選擇您的 Assistant
3. 發送測試消息
4. 觀察回應時間

**目標**：< 5 秒 ✅

### 檢查 Vercel 日誌

```bash
# 使用 Vercel CLI
vercel logs

# 或在 Dashboard 查看
Vercel Dashboard → Your Project → Functions → View Logs
```

尋找：
```
[Assistant] Waiting for completion (max 7 attempts)
```

---

## 📊 效能對比

### 優化前 vs 優化後

| 項目 | 優化前 | 優化後 |
|------|--------|--------|
| Assistant 模型 | gpt-4o | gpt-4o-mini |
| Instructions | 300+ 字 | 50 字 |
| 啟用工具 | 3 個 | 0 個 |
| 平均回應時間 | 15-30 秒 | 3-7 秒 |
| Vercel 超時率 | 90% ❌ | < 10% ✅ |

---

## 💡 進階優化技巧

### 1. 使用更短的提示詞

❌ **避免**：
```
請詳細說明婚禮場地的選擇標準，包括室內外優劣、
季節考量、賓客人數、預算範圍、交通便利性等各方面因素。
```

✅ **推薦**：
```
如何選婚禮場地？
```

系統會自動處理，讓 Assistant 簡潔回答。

### 2. 預先設定常見問題

在 Assistant 的 Instructions 中加入：
```
對於常見問題，提供 3-5 個重點即可。
如需詳細資訊，可以分次詢問。
```

### 3. 實施本地快取（選配）

編輯 `utils/generate-completion.js` 添加簡單快取：

```javascript
// 簡單的記憶快取（可選）
const responseCache = new Map();

const getCacheKey = (userId, message) => {
  return `${userId}:${message.substring(0, 50)}`;
};

// 在 generateCompletion 函數開始處
const cacheKey = getCacheKey(userId, messageContent);
if (responseCache.has(cacheKey)) {
  console.log('[Cache] Hit!');
  return responseCache.get(cacheKey);
}

// 在返回前
responseCache.set(cacheKey, completion);
```

### 4. 監控和警報

在 Vercel Dashboard 設定：
- 啟用 Error Monitoring
- 設定 Slack/Email 通知
- 追蹤超時率

---

## 🎓 理解時間分配

### 10 秒如何使用

```
總時間：10 秒
├─ Vercel 啟動：~0.5 秒（冷啟動）
├─ 創建/讀取 Thread：~0.5 秒
├─ 發送消息：~0.3 秒
├─ 運行 Assistant：~0.5 秒
├─ 輪詢等待：~7 秒（主要時間）
│  └─ Assistant 思考：~3-5 秒（理想狀態）
├─ 獲取回應：~0.5 秒
└─ 處理和返回：~0.7 秒
```

**關鍵**：Assistant 必須在 5 秒內完成思考！

---

## ⚠️ 可能遇到的問題

### 問題 1：仍然超時

**檢查清單**：
- [ ] 確認使用 `gpt-4o-mini`
- [ ] Instructions 少於 100 字
- [ ] 沒有啟用任何工具
- [ ] 環境變數 `VERCEL_MAX_DURATION=10` 已設定
- [ ] 已重新部署

**解決方案**：
```bash
# 查看日誌
vercel logs --follow

# 確認 Assistant 設定
# 前往 OpenAI Platform 再次檢查
```

### 問題 2：回答品質下降

這是速度和品質的權衡。

**緩解方法**：
1. 優化問題的問法（更具體）
2. 分多次詢問（而不是一次問很多）
3. 在 Instructions 中強調重點優先

### 問題 3：某些查詢總是超時

**原因**：某些複雜問題即使用 mini 模型也需要更長時間

**解決方案**：
```javascript
// 在 context.js 中添加友善提示
if (someComplexQuery) {
  context.pushText('這個問題比較複雜，讓我簡單回答重點：');
}
```

---

## 📈 成本分析

### OpenAI 成本（使用 gpt-4o-mini）

```
輸入：$0.15 / 1M tokens
輸出：$0.60 / 1M tokens

估算（每月 1000 次對話）：
- 平均輸入：100 tokens/次 = 0.1M tokens
- 平均輸出：150 tokens/次 = 0.15M tokens
- 成本：(0.1 × $0.15) + (0.15 × $0.60) = $0.105

月成本：約 $0.11（非常便宜！）
```

### Vercel 成本

```
免費版：$0/月
- 100 GB-Hours
- 100,000 請求/天
```

**總計月成本**：~$0.11 🎉

---

## ✅ 優化檢查清單

### 部署前
- [ ] `vercel.json` 的 `maxDuration` = 10
- [ ] 環境變數 `VERCEL_MAX_DURATION=10` 已設定
- [ ] Assistant 使用 `gpt-4o-mini` 模型
- [ ] Assistant Instructions < 100 字
- [ ] 沒有啟用 Code Interpreter
- [ ] 沒有啟用 File Search
- [ ] 沒有啟用 Function Calling
- [ ] 代碼已推送到 Git

### 部署後
- [ ] 部署成功無錯誤
- [ ] Webhook URL 已設定到 LINE
- [ ] 發送測試消息能收到回應
- [ ] 回應時間 < 8 秒
- [ ] 檢查 Vercel 日誌無超時錯誤
- [ ] 測試多種問題類型

---

## 🎯 最佳實踐總結

### DO ✅
1. 使用 `gpt-4o-mini` 模型
2. 保持 Instructions 簡短
3. 停用所有工具
4. 監控回應時間
5. 設定正確的環境變數

### DON'T ❌
1. 不要使用 `gpt-4o` 或更慢的模型
2. 不要寫很長的 Instructions
3. 不要啟用 Code Interpreter 或 File Search
4. 不要在一個問題中問太多事情
5. 不要忘記設定 `VERCEL_MAX_DURATION`

---

## 🆘 還是不行？

### 終極方案

如果優化後仍經常超時：

**選項 A：升級 Vercel Pro**
- 費用：$20/月
- 獲得：60 秒超時
- 優勢：不需優化，開箱即用

**選項 B：換平台**
- Railway：有免費額度，支援較長超時
- Render：免費版支援更長時間
- 自架 VPS：完全控制

**選項 C：混合方案**
- 簡單查詢：Vercel 免費版
- 複雜查詢：導向其他平台或提示用戶簡化問題

---

## 📚 相關資源

- OpenAI Platform: https://platform.openai.com/assistants
- Vercel Dashboard: https://vercel.com/dashboard
- 疑難排解：`TROUBLESHOOTING.md`
- Vercel 部署：`VERCEL_DEPLOYMENT.md`

---

## 🎉 完成！

完成以上優化後，您的 LINE bot 應該能在 Vercel 免費版上穩定運行了！

**關鍵指標**：
- ✅ 超時率 < 10%
- ✅ 平均回應時間 < 7 秒
- ✅ 月成本 < $1

**記住**：免費版是速度和品質的平衡。如果需要更好的體驗，考慮升級到 Pro 版。

