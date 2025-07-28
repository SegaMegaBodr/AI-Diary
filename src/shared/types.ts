import z from "zod";

// Morning/Evening Questions Schema
export const AnswerSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  type: z.enum(['morning', 'evening']),
  question_1: z.string().nullable(),
  question_2: z.string().nullable(), 
  question_3: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Answer = z.infer<typeof AnswerSchema>;

// Breathing Practice Schema
export const PracticeSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  type: z.enum(['breathing_478', 'square_breathing', 'calm_breathing']),
  duration_seconds: z.number(),
  completed_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Practice = z.infer<typeof PracticeSchema>;

// User Settings Schema
export const UserSettingsSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  morning_notification_time: z.string().nullable(),
  evening_notification_time: z.string().nullable(),
  theme: z.enum(['light', 'dark']).default('light'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

// API Request/Response types
export const CreateAnswerRequestSchema = z.object({
  type: z.enum(['morning', 'evening']),
  question_1: z.string(),
  question_2: z.string(),
  question_3: z.string(),
});

export type CreateAnswerRequest = z.infer<typeof CreateAnswerRequestSchema>;

export const CreatePracticeRequestSchema = z.object({
  type: z.enum(['breathing_478', 'square_breathing', 'calm_breathing']),
  duration_seconds: z.number(),
});

export type CreatePracticeRequest = z.infer<typeof CreatePracticeRequestSchema>;

export const UpdateSettingsRequestSchema = z.object({
  morning_notification_time: z.string().nullable().optional(),
  evening_notification_time: z.string().nullable().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export type UpdateSettingsRequest = z.infer<typeof UpdateSettingsRequestSchema>;

// Todo Schema
export const TodoSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  is_completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().nullable(),
  notes: z.string().nullable(),
  list_name: z.string().default('My Tasks'),
  reminder_date: z.string().nullable(),
  estimated_pomodoros: z.number().default(1),
  completed_pomodoros: z.number().default(0),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Todo = z.infer<typeof TodoSchema>;

// Pomodoro Session Schema
export const PomodoroSessionSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  type: z.enum(['work', 'short_break', 'long_break']).default('work'),
  duration_minutes: z.number().default(25),
  task_id: z.number().nullable(),
  completed_at: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PomodoroSession = z.infer<typeof PomodoroSessionSchema>;

// API Request types for new features
export const CreateTodoRequestSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().nullable().optional(),
  notes: z.string().optional(),
  list_name: z.string().default('My Tasks'),
  reminder_date: z.string().nullable().optional(),
  estimated_pomodoros: z.number().default(1),
});

export type CreateTodoRequest = z.infer<typeof CreateTodoRequestSchema>;

export const UpdateTodoRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  list_name: z.string().optional(),
  reminder_date: z.string().nullable().optional(),
  estimated_pomodoros: z.number().optional(),
  completed_pomodoros: z.number().optional(),
});

export type UpdateTodoRequest = z.infer<typeof UpdateTodoRequestSchema>;

export const CreatePomodoroSessionRequestSchema = z.object({
  type: z.enum(['work', 'short_break', 'long_break']).default('work'),
  duration_minutes: z.number().default(25),
  task_id: z.number().nullable().optional(),
});

export type CreatePomodoroSessionRequest = z.infer<typeof CreatePomodoroSessionRequestSchema>;

export const UpdateAnswerRequestSchema = z.object({
  question_1: z.string().optional(),
  question_2: z.string().optional(),
  question_3: z.string().optional(),
});

export type UpdateAnswerRequest = z.infer<typeof UpdateAnswerRequestSchema>;
