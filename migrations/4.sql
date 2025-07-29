-- Add notion_token column to store user's Notion access token
ALTER TABLE user_settings ADD COLUMN notion_token TEXT;
