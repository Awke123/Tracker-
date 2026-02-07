import jwt from 'jsonwebtoken';
import { validate } from '@tma.js/init-data-node';
import { pool } from '../db/pool';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

function parseInitData(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    return JSON.parse(userStr) as TelegramUser;
  } catch {
    return null;
  }
}

export async function authenticateWithTelegram(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  }

  validate(initData, botToken);
  const user = parseInitData(initData);
  if (!user) {
    throw new Error('Не удалось извлечь данные пользователя');
  }

  const client = await pool.connect();
  try {
    let result = await client.query(
      'SELECT id FROM users WHERE telegram_id = $1',
      [user.id]
    );

    let userId: number;
    if (result.rows.length === 0) {
      result = await client.query(
        `INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          user.id,
          user.username || null,
          user.first_name || null,
          user.last_name || null,
          user.photo_url || null,
        ]
      );
      userId = result.rows[0].id;

      await client.query(
        'INSERT INTO user_stats (user_id) VALUES ($1)',
        [userId]
      );
      await client.query(
        'INSERT INTO notification_settings (user_id) VALUES ($1)',
        [userId]
      );
    } else {
      userId = result.rows[0].id;
      await client.query(
        `UPDATE users SET username = $1, first_name = $2, last_name = $3, photo_url = $4, updated_at = NOW()
         WHERE id = $5`,
        [
          user.username || null,
          user.first_name || null,
          user.last_name || null,
          user.photo_url || null,
          userId,
        ]
      );
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { telegramId: user.id, userId },
      secret,
      { expiresIn: '30d' }
    );

    return { token, userId };
  } finally {
    client.release();
  }
}
