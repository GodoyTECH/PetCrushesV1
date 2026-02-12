-- Hotfix: ensure users.whatsapp is TEXT so formatted values like +55 (11) 99999-9999 are accepted.
DO $$
DECLARE
  current_data_type text;
BEGIN
  SELECT data_type
    INTO current_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'whatsapp';

  IF current_data_type IS NULL THEN
    ALTER TABLE public.users ADD COLUMN whatsapp text;
  ELSIF current_data_type IN ('smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision', 'decimal') THEN
    ALTER TABLE public.users
      ALTER COLUMN whatsapp TYPE text
      USING whatsapp::text;
  END IF;
END $$;
