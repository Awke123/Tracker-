# Трекер привычек

Telegram Mini App с геймификацией — привычки, стриками, уровнями, достижениями.

## Деплой

**1. БД** — PostgreSQL (подключись к любой облачной БД или своему серверу).

**2. Backend** — задеплой `backend` (Node.js, Express):
- Build: `npm install && npm run build`
- Start: `npm start`
- Env: `.env.example`

**3. Frontend** — задеплой `frontend` (Next.js):
- Env: `BACKEND_URL` = URL бэкенда

**4. BotFather** — Edit Bot → Edit Web App → URL фронтенда
