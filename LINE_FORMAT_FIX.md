# LINE 格式優化 - 完整解決方案

## 🎯 問題診斷

如果 LINE 上的文字還是擠在一起，主要原因是：
**OpenAI Assistant 在生成回應時沒有輸出換行符號**

## ✅ 完整解決方案

### 步驟 1：確認代碼已更新並部署

#### 檢查修改
```bash
cd "/Users/verlynchen/Library/CloudStorage/Dropbox/04_Storage/Wedding/wedding code/gpt-ai-assistant"
git diff utils/generate-completion.js
```

應該要看到新的代碼：
```javascript
text = text.replace(/[^\S\n]+/g, ' ');
```

#### 重新部署（重要！）
```bash
# Vercel
vercel --prod

# Render
git add .
git commit -m "修復 LINE 格式問題"
git push origin main
```

---

### 步驟 2：優化 OpenAI Assistant Instructions（最關鍵！）

這是最重要的一步！你需要在 Assistant 的 Instructions 中**明確要求使用換行**。

#### 前往設定
1. 登入 https://platform.openai.com/assistants
2. 選擇你的 Assistant
3. 點擊右上角的 **Edit**

#### 複製以下 Instructions（直接使用）

```
你是友善的 AI 助手，透過 LINE 與用戶對話。

【重要！回答格式規則】
1. 每個段落之間必須空一行（使用兩個換行符號 \n\n）
2. 列表項目使用「•」開頭
3. 步驟說明使用數字編號
4. 重要內容用【】標註

【格式範例】
當用戶問：「如何煮咖啡？」

正確格式：
煮咖啡的步驟如下：

準備材料：
• 咖啡豆 20g
• 熱水 300ml
• 濾紙

步驟：

1. 研磨咖啡豆
將咖啡豆磨成中等粗細

2. 準備熱水
水溫約 90-95°C

3. 沖泡
慢慢倒入熱水，等待 3 分鐘

祝你煮出美味的咖啡！

【回答原則】
• 使用繁體中文
• 簡潔清晰
• 親切友善
• 每個重點之間空一行
• 長回答要分段（每 2-3 句話就換段）
```

#### 點擊右上角 **Save**

---

### 步驟 3：測試效果

#### 在 LINE 上發送測試訊息

**測試 1：基本段落**
```
請用三個段落介紹台灣
```

**預期結果：**
```
台灣是位於東亞的美麗島嶼，擁有豐富的自然景觀。

這裡的美食文化聞名世界，從夜市小吃到精緻料理都很出色。

台灣人民熱情友善，非常歡迎來自世界各地的旅客。
```

**測試 2：列表格式**
```
請列出五個台灣必去景點
```

**預期結果：**
```
台灣必去的五個景點：

• 台北 101
世界知名的摩天大樓

• 日月潭  
湖光山色，景色優美

• 阿里山
看日出雲海的最佳地點

• 墾丁
南台灣的陽光沙灘

• 九份
山城夜景，充滿懷舊氛圍
```

---

### 步驟 4：如果還是不行

#### 檢查清單

1. **確認已重新部署**
   ```bash
   # 查看最新部署時間
   vercel ls --prod  # Vercel
   # 或查看 Render Dashboard
   ```

2. **確認 Assistant Instructions 已儲存**
   - 重新進入 OpenAI Platform
   - 檢查 Instructions 是否有格式要求

3. **測試 Assistant 直接輸出**
   - 在 OpenAI Playground 測試
   - 網址：https://platform.openai.com/playground
   - 輸入：「請用三個段落介紹台灣」
   - 檢查是否有換行

4. **檢查日誌**
   ```bash
   # Vercel
   vercel logs --prod
   
   # 查看是否有錯誤訊息
   ```

---

### 步驟 5：進階調整（如果需要）

#### 選項 A：更強制的格式要求

如果 AI 還是不乖乖換行，在 Instructions 最前面加上：

```
【最重要的規則】
你的每個回答都必須遵守以下格式：
- 第一段：簡短回答（1-2句話）
- 空一行
- 第二段：詳細說明
- 空一行  
- 第三段：補充資訊或總結

如果是列表，格式如下：
標題

• 項目一
說明

• 項目二
說明

記住：段落之間一定要空行！
```

#### 選項 B：在代碼中強制添加換行

如果 Assistant 實在不輸出換行，可以修改 `utils/generate-completion.js`：

```javascript
// 在 return 之前添加
// 強制在句號後添加換行（如果 Assistant 沒有的話）
if (text.indexOf('\n') === -1) {
  // 如果整個回應沒有任何換行，強制添加
  text = text.replace(/([。！？])\s*/g, '$1\n\n');
  // 清理多餘的換行
  text = text.replace(/\n{3,}/g, '\n\n').trim();
}

return new Completion({
  text: textContent.trim(),
  finishReason: completedRun.status === 'completed' ? FINISH_REASON_STOP : completedRun.status,
  threadId: currentThreadId,
});
```

#### 選項 C：使用特定的系統提示詞

在每次對話時自動添加格式要求。修改 `app/handlers/talk.js`：

```javascript
if (context.event.isText) {
  const formatHint = '（請用清楚的段落回答，段落之間空一行）';
  prompt.write(ROLE_HUMAN, `${t('__COMPLETION_DEFAULT_AI_TONE')(config.BOT_TONE)}${context.trimmedText}${formatHint}`).write(ROLE_AI);
}
```

---

## 🎨 最佳 Instructions 範本

根據我的經驗，以下是最有效的 Instructions 設定：

```
你是透過 LINE 對話的 AI 助手。LINE 的訊息格式很重要。

【格式規則 - 必須遵守！】

1. 段落規則：
   - 每寫完 2-3 句話就要換段
   - 段落之間空一行
   - 不要一整段長文

2. 列表規則：
   - 使用 • 符號
   - 每個項目後空一行（如有說明）

3. 編號規則：
   - 步驟說明用 1. 2. 3.
   - 每個步驟後空一行

【回答範例】

錯誤（都擠在一起）：
台灣是美麗的島嶼，有很多好玩的地方。台北有101大樓，台中有逢甲夜市，台南有古蹟。台灣美食很有名，珍珠奶茶、小籠包、牛肉麵都很好吃。

正確（有適當分段）：
台灣是美麗的島嶼，有很多好玩的地方。

主要城市景點：

• 台北：101 大樓、故宮博物院
• 台中：逢甲夜市、彩虹眷村  
• 台南：古蹟巡禮、美食天堂

必吃美食：

• 珍珠奶茶
• 小籠包
• 牛肉麵

歡迎來台灣玩！

【回答語氣】
• 親切友善
• 簡潔清晰
• 使用繁體中文
• 適當使用 emoji（如 ✨🎉😊）
```

---

## 🔍 除錯技巧

### 技巧 1：查看原始回應

在 `utils/generate-completion.js` 的 return 之前加入日誌：

```javascript
// 在 return new Completion 之前
console.log('=== 原始 AI 回應 ===');
console.log(textContent);
console.log('=== 換行符號數量 ===');
console.log('換行數：', (textContent.match(/\n/g) || []).length);
console.log('==================');
```

重新部署後，查看日誌：
```bash
vercel logs --prod  # Vercel
```

如果「換行數：0」，代表 Assistant 沒有輸出換行，需要修改 Instructions。

### 技巧 2：使用 Playground 測試

1. 前往 https://platform.openai.com/playground
2. 選擇 Assistants 模式
3. 選擇你的 Assistant
4. 輸入測試問題
5. 查看回應是否有換行

如果 Playground 也沒換行，問題就是 Instructions 不夠明確。

### 技巧 3：暫時的快速修復

如果急著上線，可以在 `utils/generate-completion.js` 中添加：

```javascript
// 臨時方案：強制添加段落
text = text
  .split('。')
  .filter(s => s.trim())
  .map(s => s.trim() + '。')
  .join('\n\n');
```

但這不是長久之計，還是要從 Assistant Instructions 改起。

---

## 💡 為什麼 LINE 格式這麼重要？

LINE 的對話框有特殊的顯示方式：
- ✅ 支援換行符號 `\n`
- ✅ 支援多個段落
- ❌ 不支援 HTML/Markdown
- ❌ 不支援粗體/斜體
- ❌ 空格不會被保留（多個空格會被合併）

所以我們只能用「換行」來做視覺分隔。

---

## 📋 完整檢查清單

完成以下步驟：

### 代碼層面
- [x] 修改 `utils/generate-completion.js`（已完成）
- [ ] 重新部署到 Vercel/Render
- [ ] 確認部署成功

### Assistant 設定
- [ ] 登入 OpenAI Platform
- [ ] 編輯 Assistant Instructions
- [ ] 加入詳細的格式要求
- [ ] 儲存設定
- [ ] 在 Playground 測試

### 測試驗證
- [ ] 發送測試訊息
- [ ] 確認有段落分隔
- [ ] 確認列表格式正確
- [ ] 查看日誌確認無錯誤

---

## 🎯 常見問題

### Q: 為什麼修改代碼後還是沒效？
A: 最可能的原因是 **Assistant 本身沒有輸出換行**。代碼只是保留換行，不會創造換行。必須在 Assistant Instructions 中明確要求。

### Q: 有沒有快速測試的方法？
A: 在 OpenAI Playground 直接測試你的 Assistant，看回應是否有換行。

### Q: 可以讓每句話都換行嗎？
A: 可以，但會太碎。建議每 2-3 句話換一段比較自然。

### Q: Emoji 可以用嗎？
A: 可以！LINE 完全支援 emoji，適當使用可以讓回答更生動。

---

## 🚀 立即行動

**現在就做這三件事：**

1. ✅ 重新部署（確保代碼更新生效）
2. ✅ 更新 Assistant Instructions（複製上面的範本）
3. ✅ 測試並驗證

**5 分鐘內就能看到效果！**

---

需要幫助嗎？查看日誌或使用 Playground 測試 Assistant。

