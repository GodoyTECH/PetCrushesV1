-- SQL_STEP2_ONBOARDING.sql
-- Cole no Neon SQL Editor e execute manualmente.

-- 1) Campo de controle explícito para onboarding completo.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 2) Garantia de updated_at preenchido no momento da alteração (opcional recomendado).
ALTER TABLE users
  ALTER COLUMN updated_at SET DEFAULT now();

-- 3) Índice para lookup de e-mail (crie somente se ainda não houver índice/constraint útil).
-- Observação: se email já for UNIQUE, este índice pode ser redundante.
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
