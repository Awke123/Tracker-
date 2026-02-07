import cron from 'node-cron';
import { pool } from '../db/pool';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendReminders() {
  if (!BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN не задан, уведомления отключены');
    return;
  }

  const result = await pool.query(
    `SELECT u.telegram_id FROM users u
     JOIN notification_settings ns ON ns.user_id = u.id
     WHERE ns.enabled = true`
  );

  const text = 'Не забудь отметить свои привычки!';
  for (const row of result.rows) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: row.telegram_id,
          text,
        }),
      });
    } catch (err) {
      console.error('Ошибка отправки уведомления:', err);
    }
  }
}

export function startNotificationScheduler() {
  cron.schedule('0 20 * * *', sendReminders, {
    timezone: 'Europe/Moscow',
  });
}
