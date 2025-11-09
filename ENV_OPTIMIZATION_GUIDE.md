# 環境變數效能優化配置指南

## 快速開始

複製以下內容到你的 `.env` 檔案中，根據需求調整：

```env
# === 速度優化核心設定 ===

# 1. 使用最快的模型
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o

# 2. 縮短超時時間（快速失敗，避免長時間等待）
OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000

# 3. Token 限制（越小回應越快）
OPENAI_COMPLETION_MAX_TOKENS=256
APP_MAX_PROMPT_TOKENS=256

# 4. 對話輪數控制（避免 context 過長）
APP_MAX_CONVERSATION_ROUNDS=10

# 5. Prompt 訊息數量限制
APP_MAX_PROMPT_MESSAGES=3

# 6. 模型參數調整
OPENAI_COMPLETION_TEMPERATURE=0.7
OPENAI_COMPLETION_FREQUENCY_PENALTY=0
OPENAI_COMPLETION_PRESENCE_PENALTY=0.6
```

## 配置說明

### 1. 模型選擇（最重要！）

#### 推薦配置
```env
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o
```

**效能對比：**
- `gpt-4o-mini`: 2-3秒，$0.15/1M tokens（最推薦）
- `gpt-4o`: 3-4秒，$2.50/1M tokens
- `gpt-4-turbo`: 5-10秒，$10/1M tokens（不建議）

### 2. 超時設定

#### Vercel 免費版（10秒限制）
```env
OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000
VERCEL_TIMEOUT=6000
VERCEL_MAX_DURATION=10
```

#### Vercel Pro 或 Render（更寬鬆）
```env
OPENAI_TIMEOUT=8000
APP_API_TIMEOUT=9000
VERCEL_MAX_DURATION=60
```

### 3. Token 限制

影響回應長度和速度：

```env
# 快速回應（可能被截斷）
OPENAI_COMPLETION_MAX_TOKENS=256

# 平衡選擇（建議）
OPENAI_COMPLETION_MAX_TOKENS=512

# 完整回應（較慢）
OPENAI_COMPLETION_MAX_TOKENS=1024
```

### 4. 對話輪數控制

防止 context 過長導致速度變慢：

```env
# 短對話（快速）
APP_MAX_CONVERSATION_ROUNDS=5

# 平衡（建議）
APP_MAX_CONVERSATION_ROUNDS=10

# 長對話（可能變慢）
APP_MAX_CONVERSATION_ROUNDS=20

# 無限制（不建議）
APP_MAX_CONVERSATION_ROUNDS=0
```

### 5. Prompt 訊息數量

```env
# 最少 context（最快）
APP_MAX_PROMPT_MESSAGES=2

# 平衡（建議）
APP_MAX_PROMPT_MESSAGES=3

# 較多 context（較慢但更準確）
APP_MAX_PROMPT_MESSAGES=5
```

## 場景推薦配置

### 場景 1：追求極速（犧牲部分品質）

```env
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_COMPLETION_MAX_TOKENS=128
OPENAI_TIMEOUT=4000
APP_API_TIMEOUT=5000
APP_MAX_CONVERSATION_ROUNDS=5
APP_MAX_PROMPT_MESSAGES=2
APP_MAX_PROMPT_TOKENS=128
```

**預期效果：**
- 平均回應時間: 1.5-2.5秒
- 適合：簡單問答、快速互動

### 場景 2：平衡速度與品質（建議）

```env
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_COMPLETION_MAX_TOKENS=256
OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000
APP_MAX_CONVERSATION_ROUNDS=10
APP_MAX_PROMPT_MESSAGES=3
APP_MAX_PROMPT_TOKENS=256
```

**預期效果：**
- 平均回應時間: 2-4秒
- 適合：大多數使用場景

### 場景 3：追求品質（速度稍慢）

```env
OPENAI_COMPLETION_MODEL=gpt-4o
OPENAI_COMPLETION_MAX_TOKENS=512
OPENAI_TIMEOUT=8000
APP_API_TIMEOUT=9000
APP_MAX_CONVERSATION_ROUNDS=15
APP_MAX_PROMPT_MESSAGES=5
APP_MAX_PROMPT_TOKENS=512
```

**預期效果：**
- 平均回應時間: 3-6秒
- 適合：複雜對話、需要高品質回應

## 完整的 .env 範例

```env
# === 基本設定 ===
NODE_ENV=production
APP_DEBUG=false
APP_LANG=zh_TW
APP_WEBHOOK_PATH=/webhook

# === OpenAI API ===
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx

# === 效能優化設定（平衡配置）===
OPENAI_COMPLETION_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o
OPENAI_COMPLETION_MAX_TOKENS=256
OPENAI_COMPLETION_TEMPERATURE=0.7
OPENAI_COMPLETION_FREQUENCY_PENALTY=0
OPENAI_COMPLETION_PRESENCE_PENALTY=0.6

OPENAI_TIMEOUT=5000
APP_API_TIMEOUT=6000
APP_MAX_CONVERSATION_ROUNDS=10
APP_MAX_PROMPT_MESSAGES=3
APP_MAX_PROMPT_TOKENS=256

# === LINE Bot ===
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_CHANNEL_SECRET=your_line_secret
LINE_TIMEOUT=6000

# === Vercel 設定（如適用）===
VERCEL_TIMEOUT=6000
VERCEL_MAX_DURATION=10

# === 其他 ===
APP_MAX_GROUPS=1000
APP_MAX_USERS=1000
BOT_NAME=AI助手
BOT_TONE=友善、簡潔
ERROR_MESSAGE_DISABLED=false
BOT_DEACTIVATED=false
```

## 效能監控

### 查看效能日誌

部署後，檢查日誌中的效能指標：

```
[Assistant] Created new thread: thread_abc123
[Assistant] Started run: run_xyz789
[Assistant] Completed in 2.34s after 5 attempts  👈 關注這個
[Conversation] Round 3/10
```

### 效能基準

**好的效能：**
- `Completed in 1.5-3.0s`
- `after 3-8 attempts`

**需要優化：**
- `Completed in >5.0s`
- `after >15 attempts`

**如果經常超過 5 秒：**
1. 檢查 Assistant 是否使用了工具（Code Interpreter, File Search）
2. 確認模型是 gpt-4o-mini
3. 檢查 Instructions 是否過長

## 常見問題

### Q: 回應經常被截斷怎麼辦？

A: 增加 `OPENAI_COMPLETION_MAX_TOKENS`：
```env
OPENAI_COMPLETION_MAX_TOKENS=512  # 或 1024
```

### Q: 經常超時怎麼辦？

A: 按優先級檢查：
1. 使用 gpt-4o-mini
2. 停用 Assistant 的所有工具
3. 簡化 Instructions
4. 如在 Vercel 免費版，考慮改用 Render

### Q: 對話變慢怎麼辦？

A: 減少對話輪數：
```env
APP_MAX_CONVERSATION_ROUNDS=5
```

### Q: 如何平衡速度和品質？

A: 使用建議的平衡配置，並：
- 對簡單問題：設定較低的 MAX_TOKENS
- 對複雜問題：設定較高的 MAX_TOKENS
- 或使用不同的 Assistant ID 分別處理

## 部署平台建議

### Render（推薦）
- ✅ 無超時限制
- ✅ 免費方案足夠
- ❌ 冷啟動較慢（15分鐘）

### Vercel Pro
- ✅ 60秒超時足夠
- ✅ 無冷啟動
- ❌ 需付費 $20/月

### Vercel Free
- ❌ 10秒超時太短
- ❌ 只適合測試

## 下一步

1. ✅ 複製建議配置到 `.env`
2. ✅ 修改 Assistant 設定（OpenAI Platform）
3. ✅ 部署並測試
4. ✅ 監控日誌，根據需要微調

---

更多詳細資訊請參考 `PERFORMANCE_OPTIMIZATION.md`

