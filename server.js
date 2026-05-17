const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

const keywords = {
  "javascript": [
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
    "https://javascript.info",
    "https://en.wikipedia.org/wiki/JavaScript"
  ],
  "nodejs": [
    "https://nodejs.org/en",
    "https://en.wikipedia.org/wiki/Node.js",
    "https://nodejs.dev"
  ],
  "css": [
    "https://developer.mozilla.org/en-US/docs/Web/CSS",
    "https://www.w3.org/Style/CSS/Overview.en.html"
  ]
};

app.get('/api/keywords', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) {
    return res.status(400).json({ error: 'Укажите ключевое слово' });
  }
  const urls = keywords[q];
  if (!urls || urls.length === 0) {
    return res.status(404).json({ error: 'По вашему запросу ничего не найдено' });
  }
  res.json({ keyword: q, urls });
});

app.get('/api/download', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Не указан URL для скачивания' });
  }

  try {
    new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Некорректный URL' });
  }

  let headResponse;
  try {
    headResponse = await fetch(targetUrl, { method: 'HEAD' });
  } catch (err) {
    return res.status(502).json({ error: 'Не удалось подключиться к удалённому серверу' });
  }

  const contentLength = headResponse.headers.get('content-length');
  if (contentLength) {
    res.setHeader('Content-Length', contentLength);
  }
  const contentType = headResponse.headers.get('content-type');
  if (contentType) {
    res.setHeader('Content-Type', contentType);
  }

  let responseStream;
  try {
    responseStream = await fetch(targetUrl);
  } catch (err) {
    return res.status(502).json({ error: 'Ошибка при загрузке ресурса' });
  }

  if (!responseStream.ok) {
    return res.status(responseStream.status).json({ error: `Удалённый сервер вернул ${responseStream.status}` });
  }

  responseStream.body.pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});