
-- Remove added columns
ALTER TABLE pomodoro_sessions DROP COLUMN task_id;
ALTER TABLE todos DROP COLUMN notes;
ALTER TABLE todos DROP COLUMN list_name;
ALTER TABLE todos DROP COLUMN reminder_date;
ALTER TABLE todos DROP COLUMN estimated_pomodoros;
ALTER TABLE todos DROP COLUMN completed_pomodoros;
