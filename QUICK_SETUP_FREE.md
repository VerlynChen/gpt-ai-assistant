# ⚡ Vercel 免費版快速設定（5 分鐘）

## 🎯 目標：在 10 秒限制內運行 Assistants API

---

## 步驟 1：優化 OpenAI Assistant（2 分鐘）

### 前往 OpenAI Platform
👉 https://platform.openai.com/assistants

### 修改您的 Assistant

#### 1. 模型選擇 ⚡
```
必須選擇：gpt-4o-mini
```
❌ 不要選 gpt-4o（太慢）

#### 2. Instructions 簡化 📝
**刪掉長篇大論，改成這樣：**

```
你是婚禮顧問助手，提供簡潔實用的建議。
回答要點：
1. 簡明扼要
2. 使用繁體中文
3. 重點優先
```

少於 100 字即可！

#### 3. 工具設定 🛠️
```
☐ Code Interpreter  （不要勾選）
☐ File Search        （不要勾選）
☐ Function           （不要勾選）
```

全部留空，最快！

#### 4. 儲存
點擊右上角 **Save**

---

## 步驟 2：設定 Vercel 環境變數（1 分鐘）

### 前往 Vercel Dashboard
👉 https://vercel.com/dashboard

選擇您的專案 → Settings → Environment Variables

### 添加這些變數：

```env
# 必要
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret

# 重要！告訴系統 Vercel 限制
VERCEL_MAX_DURATION=10

# 可選
BOT_NAME=AI
APP_LANG=zh_TW
```

點擊 **Save**

---

## 步驟 3：部署（1 分鐘）

### 方法 A：推送到 Git（推薦）

```bash
git add .
git commit -m "Optimize for Vercel free tier"
git push
```

Vercel 會自動部署！

### 方法 B：使用 Vercel CLI

```bash
vercel --prod
```

---

## 步驟 4：驗證（1 分鐘）

### 1. 檢查部署狀態
```
Vercel Dashboard → Deployments
```
看到綠色勾勾 ✅ 就成功了

### 2. 測試 LINE Bot
發送訊息給您的 bot：
```
嗨
```

應該在 5-8 秒內收到回應！

### 3. 查看日誌（可選）
```bash
vercel logs --follow
```

應該看到：
```
[Assistant] Waiting for completion (max 7 attempts)
```

---

## ✅ 完成檢查清單

- [ ] Assistant 模型改為 `gpt-4o-mini`
- [ ] Instructions 少於 100 字
- [ ] 所有工具都沒勾選
- [ ] Vercel 環境變數已設定（特別是 `VERCEL_MAX_DURATION=10`）
- [ ] 代碼已部署
- [ ] 測試訊息能正常回應
- [ ] 回應時間 < 8 秒

---

## 🎉 成功！

您的 LINE bot 現在應該可以在 Vercel 免費版上穩定運行了！

---

## 📊 預期效果

| 指標 | 目標值 |
|------|--------|
| 回應時間 | 3-7 秒 |
| 超時率 | < 10% |
| 月成本 | ~$0.11 |

---

## ⚠️ 如果還是超時

### 快速排查

1. **確認模型**
   ```
   OpenAI Platform → Assistant → Model
   必須是：gpt-4o-mini ✅
   ```

2. **確認環境變數**
   ```
   Vercel → Settings → Environment Variables
   VERCEL_MAX_DURATION=10 ✅
   ```

3. **查看日誌**
   ```bash
   vercel logs
   ```
   尋找錯誤訊息

4. **重新部署**
   ```bash
   vercel --prod
   ```

---

## 💡 優化提示

### 如何問問題

❌ **避免**：請詳細說明婚禮場地選擇的所有考量因素...（太長）

✅ **推薦**：如何選婚禮場地？（簡短）

### 複雜問題怎麼辦

分次詢問：
```
第一次：婚禮場地有哪些選項？
第二次：室外場地的優缺點？
第三次：大約需要多少預算？
```

---

## 🆘 需要幫助？

查看詳細文檔：
- **`VERCEL_FREE_OPTIMIZATION.md`** - 完整優化指南
- **`TROUBLESHOOTING.md`** - 疑難排解
- **`QUICK_START_V2.md`** - 基礎設定

---

## 🚀 下一步

完成設定後：
1. ✅ 測試各種問題
2. ✅ 監控回應時間
3. ✅ 根據需要微調 Instructions
4. ✅ 享受免費的 AI 助手！

**總時間**：< 5 分鐘  
**總成本**：~$0.11/月  
**回應速度**：3-7 秒

完美！🎊

