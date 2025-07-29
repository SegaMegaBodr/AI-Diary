import { Hono, type MiddlewareHandler } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  CreateAnswerRequestSchema,
  CreatePracticeRequestSchema,
  UpdateSettingsRequestSchema,
  CreateTodoRequestSchema,
  UpdateTodoRequestSchema,
  CreatePomodoroSessionRequestSchema,
  UpdateAnswerRequestSchema,
  type Answer,
  type Practice,
  type UserSettings,
  type Todo,
  type PomodoroSession,
} from "@/shared/types";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  NOTION_REDIRECT_URI: string;
  NOTION_DATABASE_ID: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware for development
app.use('*', async (c, next) => {
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Handle preflight requests
app.options('*', (c) => c.text('', 200));

// OAuth Routes
const NOTION_TOKEN_COOKIE_NAME = 'NOTION_TOKEN';
const NOTION_USER_COOKIE_NAME = 'NOTION_USER_ID';

const notionAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const token = getCookie(c, NOTION_TOKEN_COOKIE_NAME);
  const userId = getCookie(c, NOTION_USER_COOKIE_NAME);
  if (!token || !userId) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', { id: userId, notion_token: token });
  await next();
};

app.get('/api/oauth/notion/redirect_url', (c) => {
  const params = new URLSearchParams({
    owner: 'user',
    client_id: c.env.NOTION_CLIENT_ID,
    redirect_uri: c.env.NOTION_REDIRECT_URI,
    response_type: 'code',
  });
  const redirectUrl = `https://api.notion.com/v1/oauth/authorize?${params}`;
  return c.json({ redirectUrl }, 200);
});

app.post('/api/oauth/notion/token', async (c) => {
  const body = await c.req.json();
  const code = body.code;
  if (!code) return c.json({ error: 'No authorization code provided' }, 400);

  const authHeader =
    'Basic ' + btoa(`${c.env.NOTION_CLIENT_ID}:${c.env.NOTION_CLIENT_SECRET}`);

  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: c.env.NOTION_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const error = await tokenRes.text();
    return c.json({ error }, 400);
  }

  const tokenData = await tokenRes.json<{ access_token: string }>();
  const accessToken = tokenData.access_token;

  const meRes = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
  });

  const meData = await meRes.json<{ id: string; name?: string; avatar_url?: string }>();
  const userId = meData.id;

  await c.env.DB.prepare(
    `INSERT INTO user_settings (user_id, theme, notion_token, created_at, updated_at)
     VALUES (?, 'light', ?, datetime('now'), datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET notion_token = excluded.notion_token, updated_at = datetime('now')`
  ).bind(userId, accessToken).run();

  setCookie(c, NOTION_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });
  setCookie(c, NOTION_USER_COOKIE_NAME, userId, {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 24 * 60 * 60,
  });

  return c.json({ success: true });
});

app.get('/api/users/me', notionAuthMiddleware, async (c) => {
  const user = c.get('user');

  const meRes = await fetch('https://api.notion.com/v1/users/me', {
    headers: {
      Authorization: `Bearer ${user.notion_token}`,
      'Notion-Version': '2022-06-28',
    },
  });
  const meData = await meRes.json();
  return c.json({ id: user.id, notion_user_data: meData });
});

app.get('/api/logout', async (c) => {
  setCookie(c, NOTION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });
  setCookie(c, NOTION_USER_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });
  return c.json({ success: true }, 200);
});

// Answers API
app.get('/api/answers', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const { type, limit = '20', offset = '0', search } = c.req.query();

  let query = `SELECT * FROM answers WHERE user_id = ?`;
  const params: any[] = [user.id];

  if (type) {
    query += ` AND type = ?`;
    params.push(type);
  }

  if (search) {
    query += ` AND (question_1 LIKE ? OR question_2 LIKE ? OR question_3 LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json(results as Answer[]);
});

app.post('/api/answers', notionAuthMiddleware, zValidator('json', CreateAnswerRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { type, question_1, question_2, question_3 } = c.req.valid('json');

  // Save to Notion first
  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.notion_token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: c.env.NOTION_DATABASE_ID },
      properties: {
        Name: {
          title: [
            {
              text: { content: `${type} entry` },
            },
          ],
        },
        Type: { select: { name: type } },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: question_1 || '' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: question_2 || '' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: question_3 || '' } }] },
        },
      ],
    }),
  });

  const notionData = await notionRes.json<{ id: string }>();

  const { results } = await c.env.DB.prepare(`
    INSERT INTO answers (user_id, type, question_1, question_2, question_3, notion_page_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, type, question_1, question_2, question_3, notionData.id).all();

  return c.json(results[0] as Answer, 201);
});

app.put('/api/answers/:id', notionAuthMiddleware, zValidator('json', UpdateAnswerRequestSchema), async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.question_1 !== undefined) {
    setParts.push('question_1 = ?');
    params.push(updates.question_1);
  }
  if (updates.question_2 !== undefined) {
    setParts.push('question_2 = ?');
    params.push(updates.question_2);
  }
  if (updates.question_3 !== undefined) {
    setParts.push('question_3 = ?');
    params.push(updates.question_3);
  }

  setParts.push('updated_at = datetime(\'now\')');
  params.push(user.id, id);

  const { results } = await c.env.DB.prepare(`
    UPDATE answers
    SET ${setParts.join(', ')}
    WHERE user_id = ? AND id = ?
    RETURNING *
  `).bind(...params).all();

  if (results.length === 0) {
    return c.json({ error: 'Answer not found' }, 404);
  }

  const updated = results[0] as Answer;

  if (updated.notion_page_id) {
    await fetch(`https://api.notion.com/v1/pages/${updated.notion_page_id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${user.notion_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          Name: {
            title: [{ text: { content: `${updated.type} entry` } }],
          },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: updates.question_1 ?? updated.question_1 ?? '' } }] },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: updates.question_2 ?? updated.question_2 ?? '' } }] },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: updates.question_3 ?? updated.question_3 ?? '' } }] },
          },
        ],
      }),
    });
  }

  return c.json(updated);
});

app.delete('/api/answers/:id', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const { results } = await c.env.DB.prepare(
    `SELECT notion_page_id FROM answers WHERE user_id = ? AND id = ?`
  ).bind(user.id, id).all();

  if (results.length === 0) {
    return c.json({ error: 'Answer not found' }, 404);
  }

  const pageId = results[0].notion_page_id as string | null;

  await c.env.DB.prepare(`
    DELETE FROM answers WHERE user_id = ? AND id = ?
  `).bind(user.id, id).run();

  if (pageId) {
    await fetch(`https://api.notion.com/v1/blocks/${pageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.notion_token}`,
        'Notion-Version': '2022-06-28',
      },
    });
  }

  return c.json({ success: true });
});

// Practices API
app.get('/api/practices', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const { limit = '50' } = c.req.query();

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM practices 
    WHERE user_id = ? 
    ORDER BY completed_at DESC 
    LIMIT ?
  `).bind(user.id, parseInt(limit)).all();

  return c.json(results as Practice[]);
});

app.post('/api/practices', notionAuthMiddleware, zValidator('json', CreatePracticeRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { type, duration_seconds } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO practices (user_id, type, duration_seconds, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, type, duration_seconds).all();

  return c.json(results[0] as Practice, 201);
});

app.delete('/api/practices/:id', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const { success } = await c.env.DB.prepare(`
    DELETE FROM practices WHERE user_id = ? AND id = ?
  `).bind(user.id, id).run();

  if (!success) {
    return c.json({ error: 'Practice not found' }, 404);
  }

  return c.json({ success: true });
});

// Settings API
app.get('/api/settings', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM user_settings WHERE user_id = ?
  `).bind(user.id).all();

  if (results.length === 0) {
    // Create default settings
    const { results: newResults } = await c.env.DB.prepare(`
      INSERT INTO user_settings (user_id, theme, created_at, updated_at)
      VALUES (?, 'light', datetime('now'), datetime('now'))
      RETURNING *
    `).bind(user.id).all();
    
    return c.json(newResults[0] as UserSettings);
  }

  return c.json(results[0] as UserSettings);
});

app.put('/api/settings', notionAuthMiddleware, zValidator('json', UpdateSettingsRequestSchema), async (c) => {
  const user = c.get('user')!;
  const settings = c.req.valid('json');

  const setParts: string[] = [];
  const params: any[] = [];

  if (settings.morning_notification_time !== undefined) {
    setParts.push('morning_notification_time = ?');
    params.push(settings.morning_notification_time);
  }
  if (settings.evening_notification_time !== undefined) {
    setParts.push('evening_notification_time = ?');
    params.push(settings.evening_notification_time);
  }
  if (settings.theme !== undefined) {
    setParts.push('theme = ?');
    params.push(settings.theme);
  }
  if (settings.notion_token !== undefined) {
    setParts.push('notion_token = ?');
    params.push(settings.notion_token);
  }

  setParts.push('updated_at = datetime(\'now\')');
  params.push(user.id);

  const { results } = await c.env.DB.prepare(`
    UPDATE user_settings 
    SET ${setParts.join(', ')}
    WHERE user_id = ?
    RETURNING *
  `).bind(...params).all();

  return c.json(results[0] as UserSettings);
});

// Todos API
app.get('/api/todos', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const { completed, priority, limit = '50' } = c.req.query();

  let query = `SELECT * FROM todos WHERE user_id = ?`;
  const params: any[] = [user.id];

  if (completed !== undefined) {
    query += ` AND is_completed = ?`;
    params.push(completed === 'true');
  }

  if (priority) {
    query += ` AND priority = ?`;
    params.push(priority);
  }

  query += ` ORDER BY is_completed ASC, created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  return c.json(results as Todo[]);
});

app.post('/api/todos', notionAuthMiddleware, zValidator('json', CreateTodoRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { title, description, priority, due_date, notes, list_name, reminder_date, estimated_pomodoros } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO todos (user_id, title, description, priority, due_date, notes, list_name, reminder_date, estimated_pomodoros, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, title, description || null, priority, due_date, notes || null, list_name, reminder_date, estimated_pomodoros).all();

  return c.json(results[0] as Todo, 201);
});

app.put('/api/todos/:id', notionAuthMiddleware, zValidator('json', UpdateTodoRequestSchema), async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));
  const updates = c.req.valid('json');

  const setParts: string[] = [];
  const params: any[] = [];

  if (updates.title !== undefined) {
    setParts.push('title = ?');
    params.push(updates.title);
  }
  if (updates.description !== undefined) {
    setParts.push('description = ?');
    params.push(updates.description);
  }
  if (updates.is_completed !== undefined) {
    setParts.push('is_completed = ?');
    params.push(updates.is_completed);
  }
  if (updates.priority !== undefined) {
    setParts.push('priority = ?');
    params.push(updates.priority);
  }
  if (updates.due_date !== undefined) {
    setParts.push('due_date = ?');
    params.push(updates.due_date);
  }
  if (updates.notes !== undefined) {
    setParts.push('notes = ?');
    params.push(updates.notes);
  }
  if (updates.list_name !== undefined) {
    setParts.push('list_name = ?');
    params.push(updates.list_name);
  }
  if (updates.reminder_date !== undefined) {
    setParts.push('reminder_date = ?');
    params.push(updates.reminder_date);
  }
  if (updates.estimated_pomodoros !== undefined) {
    setParts.push('estimated_pomodoros = ?');
    params.push(updates.estimated_pomodoros);
  }
  if (updates.completed_pomodoros !== undefined) {
    setParts.push('completed_pomodoros = ?');
    params.push(updates.completed_pomodoros);
  }

  setParts.push('updated_at = datetime(\'now\')');
  params.push(user.id, id);

  const { results } = await c.env.DB.prepare(`
    UPDATE todos 
    SET ${setParts.join(', ')}
    WHERE user_id = ? AND id = ?
    RETURNING *
  `).bind(...params).all();

  if (results.length === 0) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json(results[0] as Todo);
});

app.delete('/api/todos/:id', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const { success } = await c.env.DB.prepare(`
    DELETE FROM todos WHERE user_id = ? AND id = ?
  `).bind(user.id, id).run();

  if (!success) {
    return c.json({ error: 'Todo not found' }, 404);
  }

  return c.json({ success: true });
});

// Pomodoro Sessions API
app.get('/api/pomodoro-sessions', notionAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const { limit = '50' } = c.req.query();

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM pomodoro_sessions 
    WHERE user_id = ? 
    ORDER BY completed_at DESC 
    LIMIT ?
  `).bind(user.id, parseInt(limit)).all();

  return c.json(results as PomodoroSession[]);
});

app.post('/api/pomodoro-sessions', notionAuthMiddleware, zValidator('json', CreatePomodoroSessionRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { type, duration_minutes, task_id } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO pomodoro_sessions (user_id, type, duration_minutes, task_id, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, type, duration_minutes, task_id).all();

  // If this was a work session linked to a task, update the completed pomodoros count
  if (type === 'work' && task_id) {
    await c.env.DB.prepare(`
      UPDATE todos 
      SET completed_pomodoros = completed_pomodoros + 1, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(task_id, user.id).run();
  }

  return c.json(results[0] as PomodoroSession, 201);
});

export default app;
