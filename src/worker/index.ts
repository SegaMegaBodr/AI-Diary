import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { getCookie, setCookie } from "hono/cookie";
import {
  authMiddleware,
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
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
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  const sessionToken = await exchangeCodeForSessionToken(body.code, {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
    maxAge: 60 * 24 * 60 * 60, // 60 days
  });

  return c.json({ success: true }, 200);
});

app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Answers API
app.get('/api/answers', authMiddleware, async (c) => {
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

app.post('/api/answers', authMiddleware, zValidator('json', CreateAnswerRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { type, question_1, question_2, question_3 } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO answers (user_id, type, question_1, question_2, question_3, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, type, question_1, question_2, question_3).all();

  return c.json(results[0] as Answer, 201);
});

app.put('/api/answers/:id', authMiddleware, zValidator('json', UpdateAnswerRequestSchema), async (c) => {
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

  return c.json(results[0] as Answer);
});

app.delete('/api/answers/:id', authMiddleware, async (c) => {
  const user = c.get('user')!;
  const id = parseInt(c.req.param('id'));

  const { success } = await c.env.DB.prepare(`
    DELETE FROM answers WHERE user_id = ? AND id = ?
  `).bind(user.id, id).run();

  if (!success) {
    return c.json({ error: 'Answer not found' }, 404);
  }

  return c.json({ success: true });
});

// Practices API
app.get('/api/practices', authMiddleware, async (c) => {
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

app.post('/api/practices', authMiddleware, zValidator('json', CreatePracticeRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { type, duration_seconds } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO practices (user_id, type, duration_seconds, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, type, duration_seconds).all();

  return c.json(results[0] as Practice, 201);
});

app.delete('/api/practices/:id', authMiddleware, async (c) => {
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
app.get('/api/settings', authMiddleware, async (c) => {
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

app.put('/api/settings', authMiddleware, zValidator('json', UpdateSettingsRequestSchema), async (c) => {
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
app.get('/api/todos', authMiddleware, async (c) => {
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

app.post('/api/todos', authMiddleware, zValidator('json', CreateTodoRequestSchema), async (c) => {
  const user = c.get('user')!;
  const { title, description, priority, due_date, notes, list_name, reminder_date, estimated_pomodoros } = c.req.valid('json');

  const { results } = await c.env.DB.prepare(`
    INSERT INTO todos (user_id, title, description, priority, due_date, notes, list_name, reminder_date, estimated_pomodoros, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    RETURNING *
  `).bind(user.id, title, description || null, priority, due_date, notes || null, list_name, reminder_date, estimated_pomodoros).all();

  return c.json(results[0] as Todo, 201);
});

app.put('/api/todos/:id', authMiddleware, zValidator('json', UpdateTodoRequestSchema), async (c) => {
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

app.delete('/api/todos/:id', authMiddleware, async (c) => {
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
app.get('/api/pomodoro-sessions', authMiddleware, async (c) => {
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

app.post('/api/pomodoro-sessions', authMiddleware, zValidator('json', CreatePomodoroSessionRequestSchema), async (c) => {
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
