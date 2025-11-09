# 🚀 5分鐘快速優化指南

> 將你的 GPT Assistant 回應速度從 5-10 秒降至 2-4 秒

## ✅ 第一步：更新環境變數（2分鐘）

打開你的 `.env` 檔案，添加或修改這些設定：

```env
# 複製這些到你的 .env 檔案
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_COMPLETION_MAX_TOKENS=256
OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000
APP_MAX_CONVERSATION_ROUNDS=10
APP_MAX_PROMPT_MESSAGES=3
APP_MAX_PROMPT_TOKENS=256
```

💡 **提示**：如果某些參數已存在，直接替換即可。

## ✅ 第二步：優化 OpenAI Assistant（2分鐘）

1. 前往 https://platform.openai.com/assistants
2. 點選你的 Assistant
3. 修改以下設定：
   
   **Model（模型）**：
   ```
   選擇: gpt-4o-mini  ← 最重要！
   ```
   
   **Instructions（指令）**：
   - 如果超過 500 字，簡化到 200-500 字
   - 範例：
     ```
     你是友善的AI助手。
     用繁體中文簡潔回答問題。
     保持回答清晰、準確。
     ```
   
   **Tools（工具）**：
   - ❌ Code Interpreter：停用
   - ❌ File Search：停用
   - 💡 只保留真正需要的工具
   
   **Files（檔案）**：
   - 刪除不必要的檔案

4. 點擊「Save」

## ✅ 第三步：重新部署（1分鐘）

### 如果使用 Vercel：
```bash
vercel --prod
```

### 如果使用 Render：
```bash
git add .
git commit -m "優化效能配置"
git push origin main
```

### 如果本地開發：
```bash
# 重啟應用即可
npm start
```

## ✅ 第四步：驗證效果

部署完成後，發送一則訊息測試。檢查日誌：

```
✅ 好的結果：
[Assistant] Completed in 2.34s after 5 attempts

⚠️ 需要進一步優化：
[Assistant] Completed in 6.12s after 15 attempts
→ 再次檢查 Assistant 設定

❌ 有問題：
超時錯誤
→ 查看故障排除指南
```

## 📊 預期效果

- ⚡ 回應速度：**5-10 秒 → 2-4 秒**
- 💰 API 成本：**降低 80-90%**
- ✅ 超時率：**20% → <2%**

## 🎯 三個最重要的優化

如果時間緊迫，至少做這三個：

1. ⭐⭐⭐ **使用 gpt-4o-mini** - 最大影響
2. ⭐⭐⭐ **停用 Assistant 工具** - 避免 3-10 秒延遲
3. ⭐⭐ **設定 MAX_TOKENS=256** - 加快生成

## 🛠️ 快速故障排除

### 問題：回應被截斷
```env
# 解決：增加 MAX_TOKENS
OPENAI_COMPLETION_MAX_TOKENS=512
```

### 問題：還是很慢
檢查清單：
- [ ] Assistant 模型是 gpt-4o-mini？
- [ ] 所有工具都停用了？
- [ ] Instructions 少於 500 字？
- [ ] .env 已更新並重新部署？

### 問題：經常超時
- Vercel 免費版？ → 考慮改用 Render 或升級 Pro
- 檢查 Assistant 設定

## 📚 更多資訊

- 完整指南：`PERFORMANCE_OPTIMIZATION.md`
- 配置說明：`ENV_OPTIMIZATION_GUIDE.md`
- 效果對比：`PERFORMANCE_COMPARISON.md`
- 更新總結：`OPTIMIZATION_SUMMARY.md`

## 💬 需要幫助？

1. 查看 `TROUBLESHOOTING.md`
2. 檢查應用日誌
3. 確認 Assistant 設定

---

**完成這些步驟後，你應該會看到明顯的速度提升！🎉**

開始時間：_____
完成時間：_____ 
效果：從 ___秒 降至 ___秒 ✨

