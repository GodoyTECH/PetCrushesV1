-- Execute manualmente no Neon (Postgres)

ALTER TABLE pets ADD COLUMN IF NOT EXISTS trained boolean DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS neighborhood text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS place_id text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS place_id varchar;
