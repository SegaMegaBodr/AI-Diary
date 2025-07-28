
-- Table for storing daily answers (morning/evening questions)
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'morning' or 'evening'
  question_1 TEXT, -- gratitude/good_things
  question_2 TEXT, -- joy_inspiration/learned
  question_3 TEXT, -- help/tomorrow_better
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for tracking breathing practice sessions
CREATE TABLE practices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'breathing_478', 'square_breathing', etc.
  duration_seconds INTEGER,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for user settings
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  morning_notification_time TEXT, -- HH:MM format
  evening_notification_time TEXT, -- HH:MM format
  theme TEXT DEFAULT 'light', -- 'light' or 'dark'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
