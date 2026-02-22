ALTER TABLE public.account ADD COLUMN IF NOT EXISTS authorized boolean NOT NULL DEFAULT false;
