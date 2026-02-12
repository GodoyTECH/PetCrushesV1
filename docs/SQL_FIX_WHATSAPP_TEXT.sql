-- PetCrushesV1 - FIX whatsapp as TEXT
-- Execute ONCE in Neon SQL Editor.

BEGIN;

-- 1) If users.whatsapp already exists, force it to TEXT safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'whatsapp'
  ) THEN
    EXECUTE 'ALTER TABLE public.users ALTER COLUMN whatsapp TYPE TEXT USING whatsapp::TEXT';
  END IF;
END $$;

-- 2) If legacy numeric column exists with another name, migrate to whatsapp text.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'whatsapp_numeric'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'whatsapp'
    ) THEN
      EXECUTE 'ALTER TABLE public.users ADD COLUMN whatsapp TEXT';
    END IF;

    EXECUTE 'UPDATE public.users SET whatsapp = COALESCE(whatsapp, whatsapp_numeric::TEXT)';
    EXECUTE 'ALTER TABLE public.users DROP COLUMN IF EXISTS whatsapp_numeric';
  END IF;
END $$;

-- 3) Defensive: if old numeric-like backup column was created, migrate and drop.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'whatsapp_old'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'whatsapp'
    ) THEN
      EXECUTE 'ALTER TABLE public.users ADD COLUMN whatsapp TEXT';
    END IF;

    EXECUTE 'UPDATE public.users SET whatsapp = COALESCE(whatsapp, whatsapp_old::TEXT)';
    EXECUTE 'ALTER TABLE public.users DROP COLUMN IF EXISTS whatsapp_old';
  END IF;
END $$;

COMMIT;

-- Neon SQL Editor step-by-step:
-- 1. Open Neon project -> SQL Editor.
-- 2. Paste this script.
-- 3. Execute once.
-- 4. Validate:
--    SELECT column_name, data_type FROM information_schema.columns
--    WHERE table_name = 'users' AND column_name LIKE 'whatsapp%';
