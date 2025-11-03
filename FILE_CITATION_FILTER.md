# 文件引用標記過濾說明

## 🎯 問題

當 GPT Assistant 使用 **File Search** 或引用文件時，回應中會包含引用標記：

### 常見的引用標記格式

```
這是回應內容【4:0†source】，更多資訊【5:2†document.pdf】在這裡。

根據文件 [1] 顯示...
參考資料 [2] 說明...
```

這些標記在 LINE 上看起來很亂，影響閱讀體驗。

---

## ✅ 解決方案

系統會自動過濾掉所有文件引用標記！

### 過濾的標記類型

| 標記格式 | 範例 | 說明 |
|---------|------|------|
| `【...†...】` | `【4:0†source】` | Assistant 文件引用 |
| `[數字]` | `[1]`, `[2]` | 數字引用標記 |
| `[id:num†file]` | `[4:0†doc.pdf]` | 完整引用格式 |

---

## 📝 實際範例

### 範例 1：基本文件引用

**Assistant 原始回應**：
```
根據場地資訊【4:0†venues.pdf】，推薦以下選項：
1. 海邊花園 [1]
2. 城堡莊園 [2]
```

**LINE 顯示（過濾後）**：
```
根據場地資訊，推薦以下選項：
1. 海邊花園
2. 城堡莊園
```

### 範例 2：複雜引用

**Assistant 原始回應**：
```
**預算分析**【5:1†budget.xlsx】

根據文件 [1] 顯示，平均費用為：
- 場地：NT$100,000【5:2†venues】
- 餐飲：NT$80,000 [2]

參考來源 [3] 建議預留 10% 彈性預算。
```

**LINE 顯示（過濾後）**：
```
【預算分析】

根據文件顯示，平均費用為：
• 場地：NT$100,000
• 餐飲：NT$80,000

參考來源建議預留 10% 彈性預算。
```

---

## 🔧 技術實現

### 兩層過濾機制

#### 1. Assistants API 層（第一層）
檔案：`utils/generate-completion.js`

```javascript
// 處理 API 返回的 annotations
if (content.text.annotations && content.text.annotations.length > 0) {
  content.text.annotations.forEach((annotation) => {
    // 移除標記
    if (annotation.text) {
      text = text.replace(annotation.text, '');
    }
  });
}

// 移除剩餘的引用模式
text = text.replace(/【[^】]*†[^】]*】/g, '');
text = text.replace(/\s*\[\d+\]\s*/g, ' ');
```

#### 2. 文字轉換層（第二層）
檔案：`utils/convert-text.js`

```javascript
// 再次過濾，確保沒有遺漏
converted = converted.replace(/【[^】]*†[^】]*】/g, '');
converted = converted.replace(/\s*\[\d+\]\s*/g, ' ');
converted = converted.replace(/\s*\[\d+:\d+†[^\]]*\]/g, '');
```

---

## 💡 可選：保留引用資訊

如果您想在回應末尾顯示引用來源，可以修改 `utils/generate-completion.js`：

### 啟用引用來源顯示

```javascript
// 取消註解這部分（第 240-242 行）
if (content.text.annotations && content.text.annotations.length > 0) {
  const sources = [];
  
  content.text.annotations.forEach((annotation) => {
    // 移除標記
    if (annotation.text) {
      text = text.replace(annotation.text, '');
    }
    
    // 收集來源
    if (annotation.type === 'file_citation') {
      const fileName = annotation.file_citation?.file_name || '文件';
      sources.push(fileName);
    }
  });
  
  // 在回應末尾添加來源
  if (sources.length > 0) {
    const uniqueSources = [...new Set(sources)];
    text += '\n\n📚 參考來源：\n' + uniqueSources.map((s, i) => `${i + 1}. ${s}`).join('\n');
  }
}
```

### 效果

**LINE 顯示（含來源）**：
```
根據場地資訊，推薦以下選項：
1. 海邊花園
2. 城堡莊園

📚 參考來源：
1. venues.pdf
2. budget.xlsx
```

---

## 🎯 測試

### 測試步驟

1. **確保 Assistant 啟用 File Search**
   - OpenAI Platform → Your Assistant
   - 勾選 **File Search** 工具
   - 上傳測試文件

2. **提問引用文件的問題**
   ```
   根據上傳的場地資訊，推薦適合的婚禮場地
   ```

3. **檢查 LINE 回應**
   - ✅ 不應該看到 `【...†...】`
   - ✅ 不應該看到 `[1]`, `[2]`
   - ✅ 內容清楚易讀

### 調試

如果仍然看到引用標記：

1. **查看 Render 日誌**
   ```
   Dashboard → Logs
   ```
   搜尋 "annotation" 或引用標記

2. **檢查標記格式**
   如果出現新的格式，添加到過濾規則：
   ```javascript
   // 在 convert-text.js 中添加
   converted = converted.replace(/你的新模式/g, '');
   ```

---

## 📋 支援的引用格式

### 已過濾的格式

- ✅ `【4:0†source】`
- ✅ `【citation_id†filename.pdf】`
- ✅ `[1]`, `[2]`, `[99]`
- ✅ `[4:0†source]`
- ✅ `[id:num†file.ext]`

### 不會過濾的格式

這些是正常的 Markdown 語法，會被保留並轉換：
- ❌ `[連結文字](url)` → 轉換為 "連結文字 (url)"
- ❌ `**粗體**` → 轉換為 "【粗體】"

---

## 🎨 自訂過濾規則

### 添加新的過濾模式

編輯 `utils/convert-text.js`：

```javascript
// 添加自訂過濾規則
converted = converted.replace(/你的模式/g, '替換內容');

// 例如：移除所有 emoji 引用標記
converted = converted.replace(/📖\[\d+\]/g, '');

// 例如：移除特定格式的引用
converted = converted.replace(/ref:\d+/g, '');
```

### 只過濾特定格式

如果您只想過濾某些格式：

```javascript
// 只移除 【...†...】 格式
converted = converted.replace(/【[^】]*†[^】]*】/g, '');

// 保留數字引用 [1], [2]
// 註解掉這行：
// converted = converted.replace(/\s*\[\d+\]\s*/g, ' ');
```

---

## 🔍 常見問題

### Q1: 過濾後內容變空白？

**A**: 檢查是否誤過濾了正常內容。確認過濾規則的正則表達式是否正確。

### Q2: 某些引用標記沒被過濾？

**A**: 
1. 查看標記的確切格式
2. 在 `convert-text.js` 添加新的過濾規則
3. 測試並確認

### Q3: 想保留引用編號？

**A**: 註解掉數字過濾規則：
```javascript
// converted = converted.replace(/\s*\[\d+\]\s*/g, ' ');
```

### Q4: 影響其他功能嗎？

**A**: 不會。過濾只針對特定的引用格式，不影響：
- Markdown 格式轉換
- 正常的方括號使用
- 連結語法
- 其他功能

---

## ✅ 總結

**自動過濾的標記**：
- ✅ 所有 Assistant 文件引用標記
- ✅ 數字引用 [1], [2], etc
- ✅ 複雜的引用格式

**優點**：
- ✅ 自動處理，無需手動設定
- ✅ 兩層過濾，確保清潔
- ✅ 不影響其他格式
- ✅ 可自訂過濾規則
- ✅ 可選保留來源資訊

**現在就能使用**：
- 部署後自動生效
- 在 LINE 上清楚易讀
- 支援 File Search 功能

享受乾淨的 LINE 閱讀體驗！ 🎉

