-- Add created_at column to article table with default value
ALTER TABLE article 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
