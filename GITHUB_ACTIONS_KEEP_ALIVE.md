# 使用 GitHub Actions 防止 Render 冷啟動

## 🎯 優點

使用 GitHub Actions 的好處：
- ✅ **完全免費**（GitHub Actions 每月 2000 分鐘免費）
- ✅ **不需要額外註冊**其他服務
- ✅ **可靠穩定**（GitHub 的基礎設施）
- ✅ **易於維護**（所有配置都在你的 repo 中）
- ✅ **可以查看日誌**（每次執行都有記錄）

## 📝 設定步驟

### 步驟 1：修改 Workflow 文件

我已經為你創建了 `.github/workflows/keep-alive.yml` 文件，但你需要修改一個地方：

**找到文件中的這一行：**
```yaml
response=$(curl -s -o /dev/null -w "%{http_code}" https://你的應用名稱.onrender.com/health)
```

**替換成你的實際 Render 網址：**
```yaml
response=$(curl -s -o /dev/null -w "%{http_code}" https://gpt-ai-assistant-xxxx.onrender.com/health)
```

### 步驟 2：確認 Render 網址

#### 找到你的 Render 網址

1. 登入 https://dashboard.render.com/
2. 選擇你的服務
3. 複製 URL（類似：`https://gpt-ai-assistant-xxxx.onrender.com`）

#### 測試健康檢查端點

在瀏覽器或終端測試：
```bash
curl https://你的應用名稱.onrender.com/health
```

應該看到：
```json
{
  "status": "ok",
  "platform": "render",
  "timestamp": "2024-11-09T...",
  "uptime": 123.456
}
```

### 步驟 3：推送到 GitHub

```bash
# 查看變更
git status

# 添加 workflow 文件
git add .github/workflows/keep-alive.yml

# 提交
git commit -m "添加 GitHub Actions keep-alive workflow"

# 推送到 GitHub
git push origin main
```

### 步驟 4：啟用 GitHub Actions

#### 檢查是否已啟用

1. 前往你的 GitHub repo
2. 點擊上方的 **"Actions"** 標籤
3. 如果看到 "Keep Render Alive" workflow，表示已成功設定 ✅

#### 如果 Actions 被禁用

如果看到 "Workflows aren't being run on this repository"：

1. 點擊 **"Enable Actions"**
2. 或前往 **Settings** > **Actions** > **General**
3. 選擇 **"Allow all actions and reusable workflows"**
4. 點擊 **Save**

### 步驟 5：手動測試

在 GitHub repo 的 Actions 頁面：

1. 點擊左側的 **"Keep Render Alive"**
2. 點擊右側的 **"Run workflow"**
3. 選擇 branch（通常是 `main`）
4. 點擊綠色的 **"Run workflow"** 按鈕
5. 等待幾秒鐘，刷新頁面
6. 點擊執行的 workflow 查看結果

**成功的日誌應該顯示：**
```
🏓 Pinging health endpoint...
📊 Response code: 200
✅ Service is alive!
⏰ Pinged at: Sat Nov  9 10:30:00 UTC 2024
🌍 Timezone: UTC
```

---

## 📊 Workflow 說明

### 執行頻率

```yaml
cron: '*/10 * * * *'
```

這表示：**每 10 分鐘執行一次**

#### Cron 格式說明
```
┌───────────── 分鐘 (0 - 59)
│ ┌───────────── 小時 (0 - 23)
│ │ ┌───────────── 日 (1 - 31)
│ │ │ ┌───────────── 月 (1 - 12)
│ │ │ │ ┌───────────── 星期 (0 - 6) (週日=0)
│ │ │ │ │
* * * * *
```

#### 其他頻率範例

**每 5 分鐘**（更積極）：
```yaml
cron: '*/5 * * * *'
```

**每 14 分鐘**（剛好在 15 分鐘休眠前）：
```yaml
cron: '*/14 * * * *'
```

**每 15 分鐘**（最低限度）：
```yaml
cron: '*/15 * * * *'
```

**只在白天執行**（6:00-23:00，每 10 分鐘）：
```yaml
cron: '*/10 6-23 * * *'
```

**只在工作日執行**（週一到週五，每 10 分鐘）：
```yaml
cron: '*/10 * * * 1-5'
```

### Workflow 功能

1. **自動 Ping**
   - 每 10 分鐘自動執行
   - 使用 curl 訪問健康檢查端點

2. **狀態檢查**
   - 檢查 HTTP 回應碼
   - 200 = 成功 ✅
   - 其他 = 失敗 ❌

3. **日誌記錄**
   - 記錄每次執行的時間
   - 顯示回應狀態碼

4. **手動觸發**
   - 可以在 GitHub Actions 頁面手動執行
   - 用於測試或立即喚醒服務

---

## 🔍 監控與維護

### 查看執行歷史

1. 前往 GitHub repo
2. 點擊 **"Actions"** 標籤
3. 點擊 **"Keep Render Alive"**
4. 查看所有執行記錄

**顏色代碼：**
- 🟢 綠色勾：執行成功
- 🔴 紅色叉：執行失敗
- 🟡 黃色圈：執行中

### 查看詳細日誌

點擊任一執行記錄 > 點擊 "ping" job > 查看步驟詳情

### 接收失敗通知

#### 方法 1：GitHub 通知

在 GitHub 設定中啟用：
1. Settings > Notifications
2. ✅ Actions: Workflow run fails

#### 方法 2：添加通知到 Workflow

在 `.github/workflows/keep-alive.yml` 添加：

```yaml
- name: Notify on Failure
  if: failure()
  run: |
    echo "❌ Health check failed!"
    echo "Please check your Render service."
```

---

## 📈 進階配置

### 配置 1：更詳細的日誌

修改 workflow 文件：

```yaml
- name: Ping Health Endpoint with Details
  run: |
    echo "🏓 Pinging health endpoint..."
    echo "🔗 URL: https://你的應用名稱.onrender.com/health"
    echo "⏰ Time: $(date)"
    
    response=$(curl -s https://你的應用名稱.onrender.com/health)
    status_code=$(curl -s -o /dev/null -w "%{http_code}" https://你的應用名稱.onrender.com/health)
    
    echo "📊 Status Code: $status_code"
    echo "📝 Response Body:"
    echo "$response" | jq '.'
    
    if [ "$status_code" -eq 200 ]; then
      echo "✅ Service is healthy!"
    else
      echo "❌ Service check failed!"
      exit 1
    fi
```

### 配置 2：同時 Ping 多個端點

如果你有多個服務：

```yaml
- name: Ping Multiple Endpoints
  run: |
    endpoints=(
      "https://service1.onrender.com/health"
      "https://service2.onrender.com/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
      echo "🏓 Pinging: $endpoint"
      status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
      echo "📊 Response: $status"
      
      if [ "$status" -eq 200 ]; then
        echo "✅ OK"
      else
        echo "❌ Failed"
      fi
      echo "---"
    done
```

### 配置 3：智能排程（省資源）

只在用戶活躍時段頻繁 ping：

創建兩個 workflow 文件：

**`.github/workflows/keep-alive-active.yml`**（白天）
```yaml
name: Keep Alive (Active Hours)

on:
  schedule:
    - cron: '*/5 6-23 * * *'  # 6:00-23:00, 每 5 分鐘
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Service
        run: curl https://你的應用名稱.onrender.com/health
```

**`.github/workflows/keep-alive-night.yml`**（夜間）
```yaml
name: Keep Alive (Night Hours)

on:
  schedule:
    - cron: '*/30 0-5 * * *'  # 0:00-5:00, 每 30 分鐘
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Service
        run: curl https://你的應用名稱.onrender.com/health
```

### 配置 4：使用 Secrets

如果需要認證：

1. 在 GitHub repo > Settings > Secrets and variables > Actions
2. 添加 Secret：`RENDER_URL`
3. 修改 workflow：

```yaml
- name: Ping Health Endpoint
  env:
    RENDER_URL: ${{ secrets.RENDER_URL }}
  run: |
    curl -s "$RENDER_URL/health"
```

---

## 💰 成本分析

### GitHub Actions 免費額度

- **每月免費：** 2000 分鐘
- **本 workflow 耗時：** ~10 秒/次
- **每天執行：** 144 次（每 10 分鐘）
- **每月執行：** 4320 次
- **總耗時：** 4320 × 10秒 = 43200 秒 = 720 分鐘

✅ **完全在免費額度內！**

### 優化建議

如果想省更多：
- 白天每 5 分鐘，晚上每 30 分鐘
- 只在工作日執行
- 使用 14 分鐘間隔（剛好在 15 分鐘休眠前）

---

## ⚠️ 注意事項

### 1. GitHub Actions 的限制

- **最短間隔：** 5 分鐘（不建議更短）
- **延遲：** 可能有 5-10 分鐘的延遲執行
- **不保證準時：** 高峰期可能稍有延遲

### 2. 時區

GitHub Actions 使用 **UTC 時區**。

如果要設定台灣時間（UTC+8）：
- UTC 06:00 = 台灣 14:00
- UTC 23:00 = 台灣 07:00

### 3. Repo 活躍度

如果 repo 超過 60 天沒有任何活動（commit, PR, issue），GitHub 可能會暫停 scheduled workflows。

**解決方法：**
- 定期更新 repo
- 或使用其他 cron 服務（如 Cron-Job.org）

---

## 🐛 故障排除

### 問題 1：Workflow 沒有執行

**可能原因：**
- Actions 未啟用
- Workflow 檔案格式錯誤
- Repo 已超過 60 天沒活動

**解決方法：**
1. 檢查 Settings > Actions > General
2. 驗證 YAML 格式：https://yamlchecker.com/
3. 手動執行一次測試

### 問題 2：執行失敗（紅色 X）

**檢查步驟：**
1. 點擊失敗的執行記錄
2. 查看錯誤訊息
3. 常見錯誤：
   - URL 錯誤（404）
   - 服務未回應（timeout）
   - 權限問題

**解決方法：**
```bash
# 手動測試 URL
curl -v https://你的應用名稱.onrender.com/health
```

### 問題 3：服務還是休眠了

**可能原因：**
- Ping 間隔太長（>15 分鐘）
- Workflow 執行延遲
- Render 服務本身有問題

**解決方法：**
- 縮短間隔到 5 或 10 分鐘
- 結合其他方法（Cron-Job.org + GitHub Actions）
- 檢查 Render 服務狀態

---

## 📊 效果驗證

### 驗證步驟

1. **等待 15 分鐘**
   讓服務在沒有 ping 的情況下本該休眠

2. **查看 Actions 日誌**
   確認有定期執行且成功

3. **在 LINE 測試**
   發送訊息，應該立即回應（2-4 秒）

4. **查看 Render 日誌**
   應該看到定期的 `/health` 請求

### 成功指標

- ✅ Actions 每 10 分鐘成功執行
- ✅ Render 服務持續運行
- ✅ LINE 回應時間穩定在 2-4 秒
- ✅ 沒有冷啟動延遲

---

## 🔄 與其他方法比較

| 方法 | 成本 | 可靠性 | 設定難度 | 維護 |
|------|------|--------|----------|------|
| GitHub Actions | 免費 | ⭐⭐⭐⭐ | 簡單 | 低 |
| Cron-Job.org | 免費 | ⭐⭐⭐⭐⭐ | 最簡單 | 極低 |
| UptimeRobot | 免費 | ⭐⭐⭐⭐⭐ | 簡單 | 低 |
| Render 付費 | $7/月 | ⭐⭐⭐⭐⭐ | 無需設定 | 無 |

**推薦組合：** GitHub Actions + Cron-Job.org（雙重保險）

---

## 🎯 快速檢查清單

完成以下步驟：

- [ ] 1. 確認 `.github/workflows/keep-alive.yml` 已創建
- [ ] 2. 修改 workflow 中的 Render URL
- [ ] 3. 提交並推送到 GitHub
- [ ] 4. 確認 GitHub Actions 已啟用
- [ ] 5. 手動執行一次測試
- [ ] 6. 查看執行日誌確認成功
- [ ] 7. 等待 15 分鐘後測試 LINE 回應
- [ ] 8. 驗證沒有冷啟動問題

---

## 📚 參考資料

- GitHub Actions 文檔：https://docs.github.com/en/actions
- Cron 表達式工具：https://crontab.guru/
- YAML 驗證工具：https://yamlchecker.com/
- Render 健康檢查：https://render.com/docs/health-checks

---

## 🚀 下一步

完成設定後：

1. ✅ 監控前幾天的執行狀況
2. ✅ 根據需要調整頻率
3. ✅ 考慮添加第二種 keep-alive 方法（如 Cron-Job.org）作為備援
4. ✅ 享受快速的回應時間！

---

**祝設定順利！有任何問題隨時查看 Actions 日誌或詢問我。** 🎉

