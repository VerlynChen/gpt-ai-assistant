# Render SIGTERM 錯誤解決指南

## 🔴 錯誤訊息

```
npm error path /app
npm error command failed
npm error signal SIGTERM
npm error command sh -c node api/index.js
```

## 🎯 問題原因

`SIGTERM` 表示進程被強制終止，在 Render 上常見的原因有：

1. **記憶體不足** ⭐ 最常見
2. **環境變數缺失** ⭐ 常見
3. **啟動超時**
4. **依賴安裝失敗**
5. **Health Check 失敗**

---

## ✅ 解決方案

### 方案 1：檢查環境變數（最可能的問題）

#### 在 Render Dashboard 檢查

1. 前往 https://dashboard.render.com/
2. 選擇你的服務
3. 點擊左側 **"Environment"**
4. 確認以下**必要**的環境變數都已設定：

```
✅ 必須設定的變數：
- OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
- OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
- LINE_CHANNEL_ACCESS_TOKEN=你的token
- LINE_CHANNEL_SECRET=你的secret

✅ 效能優化變數（建議）：
- NODE_ENV=production
- OPENAI_COMPLETION_MODEL=gpt-4o-mini
- OPENAI_TIMEOUT=5000
- APP_API_TIMEOUT=6000
- APP_MAX_CONVERSATION_ROUNDS=10
- OPENAI_COMPLETION_MAX_TOKENS=256
```

#### 如果缺少環境變數

添加後點擊 **"Save Changes"**，Render 會自動重新部署。

---

### 方案 2：降低記憶體使用（Render 免費版限制）

Render 免費版只有 **512MB RAM**，可能不夠用。

#### 優化 package.json

修改 `package.json` 的 start script：

```json
{
  "scripts": {
    "start": "node --max-old-space-size=450 api/index.js"
  }
}
```

這會限制 Node.js 使用最多 450MB 記憶體（留一些給系統）。

#### 推送更新

```bash
git add package.json
git commit -m "優化記憶體使用"
git push origin main
```

---

### 方案 3：增加啟動超時時間

#### 在 Render Dashboard 設定

1. 前往你的服務 > **Settings**
2. 找到 **"Health Check Path"**
3. 設定為：`/health`
4. **"Health Check Timeout"**: 設定為 `60` 秒
5. **"Health Check Interval"**: 設定為 `30` 秒
6. 點擊 **"Save Changes"**

---

### 方案 4：檢查 Build 和 Start Commands

#### 在 Render Dashboard 確認

**Settings** > **Build & Deploy**：

```
Build Command: npm install
Start Command: npm start
```

如果不是這樣，修改為正確的命令。

---

### 方案 5：查看完整日誌

#### 在 Render Dashboard

1. 點擊左側 **"Logs"**
2. 查看完整的錯誤訊息
3. 尋找以下關鍵字：

**記憶體問題：**
```
JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**環境變數問題：**
```
Error: OPENAI_API_KEY is not configured
Error: Cannot read property 'xxx' of undefined
```

**依賴問題：**
```
Cannot find module 'xxx'
Error: Cannot find package 'xxx'
```

---

## 🔍 詳細診斷步驟

### 步驟 1：查看 Render 日誌

在 Render Dashboard > Logs，找到錯誤發生的時間點，查看：

1. **Build 階段**是否成功
   ```
   ✅ 應該看到：
   Installing dependencies...
   added XX packages
   Build succeeded
   ```

2. **Start 階段**是否啟動
   ```
   ✅ 應該看到：
   🚀 Server is running on port 10000
   📍 Platform: render
   🔗 Health check: http://localhost:10000/health
   ```

3. **錯誤訊息**
   ```
   ❌ 如果看到 SIGTERM，記下之前的錯誤訊息
   ```

### 步驟 2：測試本地環境

在本地測試是否正常：

```bash
# 設定環境變數（暫時測試）
export OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
export OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
export LINE_CHANNEL_ACCESS_TOKEN=你的token
export LINE_CHANNEL_SECRET=你的secret

# 啟動服務
npm start
```

如果本地正常，問題就是 Render 的環境變數或資源限制。

### 步驟 3：檢查依賴

```bash
# 清除並重新安裝
rm -rf node_modules package-lock.json
npm install

# 測試啟動
npm start
```

如果本地沒問題，推送 `package-lock.json`：

```bash
git add package-lock.json
git commit -m "更新依賴鎖定文件"
git push origin main
```

---

## 🎯 最可能的解決方案（按優先順序）

### 1️⃣ 檢查環境變數 ⭐⭐⭐⭐⭐

**90% 的 SIGTERM 錯誤是因為環境變數缺失**

在 Render > Environment，確認這些變數都有設定：
- `OPENAI_API_KEY`
- `OPENAI_ASSISTANT_ID`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

### 2️⃣ 設定健康檢查 ⭐⭐⭐⭐

Render > Settings：
- Health Check Path: `/health`
- Timeout: 60 秒

### 3️⃣ 優化記憶體使用 ⭐⭐⭐

修改 `package.json`：
```json
"start": "node --max-old-space-size=450 api/index.js"
```

### 4️⃣ 檢查日誌找真正原因 ⭐⭐⭐⭐⭐

Render > Logs，查看 SIGTERM 之前的錯誤訊息。

---

## 💡 預防措施

### 添加更好的錯誤處理

在 `api/index.js` 添加：

```javascript
// 在文件最後添加
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
```

這樣可以在日誌中看到更多錯誤資訊。

---

## 📊 Render 免費版限制

了解限制可以幫助診斷問題：

| 資源 | 限制 |
|------|------|
| RAM | 512 MB |
| CPU | 共享 |
| 閒置超時 | 15 分鐘 |
| 啟動超時 | 未明確，但約 5-10 分鐘 |
| 每月運行時間 | 750 小時 |

**如果超過記憶體限制**，進程會被 kill（SIGTERM）。

---

## 🔧 進階診斷

### 添加詳細日誌

修改 `api/index.js`：

```javascript
import express from 'express';
import { handleEvents, printPrompts } from '../app/index.js';
import config from '../config/index.js';
import { validateLineSignature } from '../middleware/index.js';
import storage from '../storage/index.js';
import { fetchVersion, getVersion } from '../utils/index.js';

// 添加啟動日誌
console.log('📦 Starting application...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('💾 Memory:', process.memoryUsage());
console.log('⚙️ Config loaded:', {
  OPENAI_API_KEY: config.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
  OPENAI_ASSISTANT_ID: config.OPENAI_ASSISTANT_ID ? '✅ Set' : '❌ Missing',
  LINE_CHANNEL_ACCESS_TOKEN: config.LINE_CHANNEL_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
  LINE_CHANNEL_SECRET: config.LINE_CHANNEL_SECRET ? '✅ Set' : '❌ Missing',
});

const app = express();

// ... 其餘代碼不變

// 在 app.listen 之後添加
if (PORT) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Platform: ${config.RENDER ? 'Render' : (config.VERCEL_ENV ? 'Vercel' : 'Local')}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📨 Webhook: http://localhost:${PORT}${config.APP_WEBHOOK_PATH}`);
    console.log('💾 Memory after start:', process.memoryUsage());
  });

  // 錯誤處理
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
}

export default app;
```

這樣可以看到：
- 哪些環境變數缺失
- 記憶體使用情況
- 啟動過程中的錯誤

---

## 🎯 快速檢查清單

按照這個順序檢查：

- [ ] 1. Render > Environment：所有環境變數都設定了嗎？
- [ ] 2. Render > Logs：Build 階段成功了嗎？
- [ ] 3. Render > Logs：看到 "Server is running" 了嗎？
- [ ] 4. Render > Settings：Health Check 設定正確嗎？
- [ ] 5. 本地測試：`npm start` 能正常啟動嗎？
- [ ] 6. 記憶體優化：package.json 有設定 max-old-space-size 嗎？

---

## 📞 還是不行？

### 提供以下資訊以便診斷

1. **Render 日誌的完整錯誤訊息**（從 Build 開始到 SIGTERM）
2. **環境變數是否都已設定**
3. **本地測試是否正常**
4. **Render 服務的 Plan**（Free/Starter）

### 臨時解決方案

如果急著上線，可以：
1. 升級到 Render Starter（$7/月，更多資源）
2. 或暫時部署到 Railway（免費版限制較寬鬆）

---

## 💡 最終建議

**最常見的問題是環境變數缺失**，請先確認：

1. 前往 Render > Environment
2. 檢查這 4 個變數是否都有值：
   - `OPENAI_API_KEY`
   - `OPENAI_ASSISTANT_ID`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
3. 如果缺少，添加後 Save
4. 等待重新部署
5. 查看 Logs 確認啟動成功

---

**90% 的情況下，設定好環境變數就能解決問題！** 🎯

