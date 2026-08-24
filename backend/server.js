import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';

const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '0.0.0.0';
const ENGINE_URL = (process.env.SG16_ENGINE_URL || 'https://sg16engine.com').replace(/\/$/, '');
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = new Set([
  'https://sg16children.com',
  'https://www.sg16children.com',
  ...(process.env.SG16_CHILDREN_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  ...(isProd ? [] : ['http://localhost:3000', 'http://localhost:8787', 'http://127.0.0.1:3000', 'http://127.0.0.1:8787']),
]);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  }),
);

app.use(express.json({ limit: '256kb' }));

const chatRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later.' },
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'sg16children-api',
    engine: ENGINE_URL,
  });
});

app.get('/api/sg16/health', async (_req, res) => {
  try {
    const upstream = await fetch(`${ENGINE_URL}/api/sg16/health`);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ status: 'degraded', error: err.message });
  }
});

app.post('/api/sg16/chat', chatRateLimit, async (req, res) => {
  try {
    const upstream = await fetch(`${ENGINE_URL}/api/sg16/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || 'Invalid upstream response' };
    }

    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: 'Brain unavailable',
      reply: 'Oops — Robo needs a short break. Ask a parent to help and try again in a minute.',
      safe: false,
      flags: ['upstream_error'],
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`sg16children-api listening on ${HOST}:${PORT} -> ${ENGINE_URL}`);
});
