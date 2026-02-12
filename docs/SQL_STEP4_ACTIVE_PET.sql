-- Stage 4: Active pet support
ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS pets_owner_active_idx
  ON pets (owner_id, is_active);

-- Optional backfill: mark first pet as active for owners that currently have none active.
WITH first_pet AS (
  SELECT DISTINCT ON (owner_id) id, owner_id
  FROM pets
  ORDER BY owner_id, id ASC
)
UPDATE pets p
SET is_active = true
FROM first_pet fp
WHERE p.id = fp.id
  AND NOT EXISTS (
    SELECT 1 FROM pets p2 WHERE p2.owner_id = fp.owner_id AND p2.is_active = true
  );
