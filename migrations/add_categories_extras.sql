-- Add extras JSONB column to categories table
-- This stores additional metadata per category (e.g. image_path)

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT NULL;
