-- SQL_STEP2_ONBOARDING.sql
-- Execute manualmente no Neon SQL Editor (não rodar via migração automática).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name varchar,
  ADD COLUMN IF NOT EXISTS whatsapp varchar,
  ADD COLUMN IF NOT EXISTS region varchar,
  ADD COLUMN IF NOT EXISTS profile_image_url varchar,
  ADD COLUMN IF NOT EXISTS first_name varchar,
  ADD COLUMN IF NOT EXISTS last_name varchar,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();
