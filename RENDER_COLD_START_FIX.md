# Render 冷啟動優化指南

## 🎯 問題說明

### Render 免費版的限制
- **閒置 15 分鐘後**，服務會自動休眠
- **下次訪問時**需要重新啟動（冷啟動）
- **冷啟動時間**：30 秒 - 2 分鐘
- **用戶體驗**：第一則訊息回應很慢

## ✅ 解決方案

### 方案 1：使用 Cron Job 保持喚醒（推薦！免費）⭐

使用免費的 Cron Job 服務定期 ping 你的應用，防止它休眠。

#### 推薦服務

##### 選項 A：Cron-Job.org（最推薦）

**步驟 1：註冊**
- 網址：https://cron-job.org/
- 免費註冊（可用 Google 登入）

**步驟 2：創建 Cron Job**

1. 登入後點擊 **"Create cronjob"**

2. 填寫資訊：
   ```
   Title: Keep Render Awake
   Address: https://你的應用名稱.onrender.com/
   Schedule: */10 * * * * (每 10 分鐘)
   ```

3. **重要設定：**
   - ✅ Enabled: 打勾
   - Request method: GET
   - Schedule type: Every 10 minutes
   - Timezone: 選擇你的時區

4. 點擊 **"Create cronjob"**

**完成！** 現在每 10 分鐘會自動訪問你的應用，保持喚醒。

---

##### 選項 B：UptimeRobot

**步驟 1：註冊**
- 網址：https://uptimerobot.com/
- 免費註冊

**步驟 2：添加監控**

1. 點擊 **"Add New Monitor"**

2. 填寫資訊：
   ```
   Monitor Type: HTTP(s)
   Friendly Name: GPT Assistant
   URL: https://你的應用名稱.onrender.com/
   Monitoring Interval: 5 minutes（最短間隔）
   ```

3. 點擊 **"Create Monitor"**

**優點：** 還能監控服務是否正常運作

---

##### 選項 C：EasyCron

**步驟 1：註冊**
- 網址：https://www.easycron.com/
- 免費方案

**步驟 2：創建 Cron Job**
```
URL: https://你的應用名稱.onrender.com/
Cron Expression: */10 * * * * (每 10 分鐘)
```

---

### 方案 2：創建健康檢查端點

為了讓 Cron Job 更有效，可以添加一個輕量的健康檢查端點。

**步驟 1：創建健康檢查路由**

在 `api/index.js` 中添加：

```javascript
// 健康檢查端點（輕量級，快速回應）
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'gpt-assistant'
  });
});

// 或者更簡單的
app.get('/ping', (req, res) => {
  res.send('pong');
});
```

**步驟 2：重新部署**

```bash
git add .
git commit -m "添加健康檢查端點"
git push origin main
```

**步驟 3：使用新端點**

在 Cron Job 服務中使用：
```
https://你的應用名稱.onrender.com/health
```
或
```
https://你的應用名稱.onrender.com/ping
```

---

### 方案 3：優化應用啟動時間

減少冷啟動時的加載時間。

#### 優化 1：使用環境變數預加載

在 `package.json` 中：

```json
{
  "scripts": {
    "start": "node api/index.js",
    "start:fast": "NODE_ENV=production node --max-old-space-size=512 api/index.js"
  }
}
```

在 Render Dashboard 中設置：
```
Build Command: npm install
Start Command: npm run start:fast
```

#### 優化 2：減少依賴包大小

檢查並移除不必要的依賴：

```bash
# 查看依賴包大小
npm ls --depth=0

# 移除未使用的包
npm prune
```

#### 優化 3：使用 Node.js 18+

在 Render Dashboard > Environment：
```
NODE_VERSION=18
```

Node.js 18 啟動速度比舊版本快。

---

### 方案 4：升級 Render 付費方案

如果預算允許，最直接的方法。

#### Starter 方案（$7/月）
- ✅ **不會休眠**
- ✅ 更快的啟動速度
- ✅ 更多記憶體
- ✅ 更好的效能

**適合：** 正式上線的服務

**不適合：** 只是測試或個人使用

---

## 📊 方案對比

| 方案 | 成本 | 效果 | 難度 | 推薦度 |
|------|------|------|------|--------|
| Cron Job | 免費 | ⭐⭐⭐⭐⭐ | 簡單 | ⭐⭐⭐⭐⭐ |
| 健康檢查端點 | 免費 | ⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| 優化啟動時間 | 免費 | ⭐⭐⭐ | 中等 | ⭐⭐⭐ |
| 付費方案 | $7/月 | ⭐⭐⭐⭐⭐ | 最簡單 | ⭐⭐⭐ |

---

## 🎯 推薦配置（最佳實踐）

### 配置 1：免費方案（推薦！）

```
1. ✅ 使用 Cron-Job.org 每 10 分鐘 ping
2. ✅ 添加 /health 端點
3. ✅ 使用 Node.js 18
```

**效果：** 幾乎不會遇到冷啟動

### 配置 2：付費方案

```
1. ✅ 升級 Render Starter ($7/月)
2. ✅ 添加 /health 端點（用於監控）
3. ✅ 使用 UptimeRobot 監控（免費）
```

**效果：** 完全沒有冷啟動問題

---

## 🔧 完整實作步驟

### 步驟 1：添加健康檢查端點

修改 `api/index.js`，在其他路由之前添加：

```javascript
import express from 'express';

const app = express();

// 健康檢查端點 - 放在最前面
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'gpt-assistant'
  });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// 其他路由...
app.post(config.APP_WEBHOOK_PATH, ...)
```

### 步驟 2：部署到 Render

```bash
git add api/index.js
git commit -m "添加健康檢查端點"
git push origin main
```

### 步驟 3：測試健康檢查

```bash
curl https://你的應用名稱.onrender.com/health
```

應該看到：
```json
{
  "status": "ok",
  "timestamp": "2024-11-09T...",
  "uptime": 123.456,
  "service": "gpt-assistant"
}
```

### 步驟 4：設定 Cron Job

1. 前往 https://cron-job.org/
2. 註冊/登入
3. Create cronjob
4. 填寫：
   - URL: `https://你的應用名稱.onrender.com/health`
   - Schedule: Every 10 minutes
5. Save

### 步驟 5：驗證

等待 15 分鐘後，在 LINE 發送訊息，應該：
- ✅ 立即回應（不用等冷啟動）
- ✅ 回應時間 2-4 秒

---

## 📈 監控與維護

### 檢查 Cron Job 是否運作

在 Cron-Job.org Dashboard：
- 查看 "Last execution"
- 確認狀態是綠色 ✅

### 檢查 Render 日誌

在 Render Dashboard > Logs：
```
[GET] /health - 200 OK
[GET] /health - 200 OK
...每 10 分鐘一次
```

### 測試冷啟動時間

1. 在 Render Dashboard 手動關閉服務
2. 等待重啟
3. 記錄啟動時間
4. 目標：< 30 秒

---

## 💡 進階優化

### 優化 1：智能 Ping 時段

如果你的用戶主要在特定時段使用，可以設定：

**白天頻繁 Ping（用戶活躍時段）：**
```
6:00-23:00: 每 5 分鐘
23:00-6:00: 每 30 分鐘或不 ping
```

在 Cron-Job.org 創建兩個任務：
- 任務 1: `*/5 6-23 * * *`（白天每 5 分鐘）
- 任務 2: `*/30 0-5 * * *`（晚上每 30 分鐘）

### 優化 2：使用 GitHub Actions

在 `.github/workflows/keep-alive.yml`：

```yaml
name: Keep Render Alive

on:
  schedule:
    - cron: '*/10 * * * *'  # 每 10 分鐘
  workflow_dispatch:  # 允許手動觸發

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Render Service
        run: |
          curl https://你的應用名稱.onrender.com/health
```

**優點：** 不需要額外服務，GitHub Actions 免費

### 優化 3：預熱關鍵服務

在應用啟動時預加載：

```javascript
// api/index.js
import { createThread } from './services/openai.js';

// 預熱 OpenAI 連線（應用啟動時）
if (config.APP_ENV === 'production') {
  console.log('[Warmup] 預熱 OpenAI 服務...');
  createThread().then(() => {
    console.log('[Warmup] OpenAI 服務預熱完成');
  }).catch(err => {
    console.log('[Warmup] 預熱失敗（正常，會在實際使用時連線）');
  });
}
```

---

## ⚠️ 注意事項

### 注意 1：不要 Ping 太頻繁

- ❌ 每 1 分鐘：可能被視為濫用
- ✅ 每 5-10 分鐘：最佳平衡
- ✅ 每 14 分鐘：最低限度（Render 15 分鐘休眠）

### 注意 2：Render 的使用限制

Render 免費版：
- 每月 750 小時免費運行時間
- 如果 24/7 運行：30 天 × 24 小時 = 720 小時
- ✅ 完全足夠！

### 注意 3：備選方案

如果 Render 不符合需求，可以考慮：
- **Railway**：免費版也會休眠，但啟動較快
- **Fly.io**：免費版提供更多資源
- **Heroku**：已取消免費方案
- **Vercel**：適合無狀態應用

---

## 🎯 快速開始檢查清單

完成以下步驟解決冷啟動問題：

- [ ] 1. 添加 `/health` 端點到代碼
- [ ] 2. 部署到 Render
- [ ] 3. 測試健康檢查端點
- [ ] 4. 註冊 Cron-Job.org
- [ ] 5. 創建 Cron Job（每 10 分鐘）
- [ ] 6. 等待 15 分鐘測試
- [ ] 7. 確認不再有冷啟動

---

## 📊 效果對比

### 優化前
```
第一則訊息：等待 30-60 秒 ⏰
（冷啟動中...）
後續訊息：2-4 秒 ✅
```

### 優化後
```
第一則訊息：2-4 秒 ✅
後續訊息：2-4 秒 ✅
（永遠保持喚醒）
```

---

## 🚀 立即實作

**現在就做這三件事：**

1. ✅ 添加健康檢查端點（5 分鐘）
2. ✅ 部署到 Render（2 分鐘）  
3. ✅ 設定 Cron Job（3 分鐘）

**總共 10 分鐘，永久解決冷啟動問題！**

---

## 📚 相關資源

- Cron-Job.org: https://cron-job.org/
- UptimeRobot: https://uptimerobot.com/
- Render 文檔: https://render.com/docs/free
- Cron 表達式工具: https://crontab.guru/

---

**完成設定後，你的 Render 服務就會保持喚醒，不會再有冷啟動問題了！** 🎉

