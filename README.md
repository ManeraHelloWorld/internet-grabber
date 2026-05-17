# HTTP Client/Server для сбора информации из интернета

Учебный проект, реализующий клиент-серверное приложение для поиска и сохранения веб-страниц по ключевым словам.

## Функционал
- Поиск URL по ключевому слову (сервер хранит базу слов и ссылок)
- Скачивание выбранного URL через прокси сервера с отображением прогресса
- Сохранение загруженных страниц в LocalStorage для офлайн-просмотра
- Обработка ошибок на всех этапах

## Технологии
- Backend: Node.js, Express
- Frontend: Vanilla JS, Fetch API, ReadableStream
- Хранение на клиенте: LocalStorage

## Публичный доступ
Приложение развёрнуто по адресу: [ссылка на Glitch/Render]

## Локальный запуск
\`\`\`bash
git clone <ваш-репозиторий>
cd internet-grabber
npm install
npm start
\`\`\`
Откройте http://localhost:3000

## Структура проекта
- `server.js` – серверная логика, статические файлы
- `public/index.html` – разметка клиента
- `public/client.js` – клиентская логика
- `public/style.css` – стили

## API сервера
- `GET /api/keywords?q=слово` → `{ keyword, urls }`
- `GET /api/download?url=...` → поток контента с заголовком Content-Length