import express from 'express';
import { handleEvents, printPrompts } from '../app/index.js';
import config from '../config/index.js';
import { validateLineSignature } from '../middleware/index.js';
import storage from '../storage/index.js';
import { fetchVersion, getVersion } from '../utils/index.js';

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
}));

app.get('/', async (req, res) => {
  if (config.APP_URL) {
    res.redirect(config.APP_URL);
    return;
  }
  const currentVersion = getVersion();
  const latestVersion = await fetchVersion();
  res.status(200).send({ status: 'OK', currentVersion, latestVersion });
});

// Health check endpoint (useful for Render cron jobs to prevent sleep)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    platform: config.RENDER ? 'render' : (config.VERCEL_ENV ? 'vercel' : 'local'),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.post(config.APP_WEBHOOK_PATH, validateLineSignature, async (req, res) => {
  try {
    await storage.initialize();
    await handleEvents(req.body.events);
    res.sendStatus(200);
  } catch (err) {
    console.error(err.message);
    res.sendStatus(500);
  }
  if (config.APP_DEBUG) printPrompts();
});

// Render uses PORT environment variable, fallback to APP_PORT for local dev
const PORT = process.env.PORT || config.APP_PORT || 10000;

if (PORT) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Platform: ${config.RENDER ? 'Render' : (config.VERCEL_ENV ? 'Vercel' : 'Local')}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📨 Webhook: http://localhost:${PORT}${config.APP_WEBHOOK_PATH}`);
  });
}

export default app;
