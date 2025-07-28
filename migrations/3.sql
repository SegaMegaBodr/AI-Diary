
-- Add task_id column to pomodoro_sessions to link them with todos
ALTER TABLE pomodoro_sessions ADD COLUMN task_id INTEGER;

-- Add notes column to todos for additional details
ALTER TABLE todos ADD COLUMN notes TEXT;

-- Add list_name column to todos for categorization
ALTER TABLE todos ADD COLUMN list_name TEXT DEFAULT 'My Tasks';

-- Add reminder_date column to todos
ALTER TABLE todos ADD COLUMN reminder_date DATETIME;

-- Add estimated_pomodoros column to todos
ALTER TABLE todos ADD COLUMN estimated_pomodoros INTEGER DEFAULT 1;

-- Add completed_pomodoros column to todos (calculated field but stored for performance)
ALTER TABLE todos ADD COLUMN completed_pomodoros INTEGER DEFAULT 0;
