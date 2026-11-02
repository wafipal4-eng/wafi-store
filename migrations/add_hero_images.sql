-- Add hero_mobile and hero_laptop columns to store table
ALTER TABLE store
ADD COLUMN IF NOT EXISTS hero_mobile TEXT,
ADD COLUMN IF NOT EXISTS hero_laptop TEXT;
