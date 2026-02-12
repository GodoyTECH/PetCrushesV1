ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_text text;
UPDATE users SET whatsapp_text = COALESCE(whatsapp_text, whatsapp::text);

-- Se quiser migrar de vez no futuro:
-- ALTER TABLE users DROP COLUMN whatsapp;
-- ALTER TABLE users RENAME COLUMN whatsapp_text TO whatsapp;
