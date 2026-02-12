-- Stage 4: idempotent unique matches
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS pet_low_id integer,
  ADD COLUMN IF NOT EXISTS pet_high_id integer;

UPDATE matches
SET pet_low_id = LEAST(pet_a_id, pet_b_id),
    pet_high_id = GREATEST(pet_a_id, pet_b_id)
WHERE pet_low_id IS NULL OR pet_high_id IS NULL;

ALTER TABLE matches
  ALTER COLUMN pet_low_id SET NOT NULL,
  ALTER COLUMN pet_high_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS matches_pet_pair_unique_idx
  ON matches (pet_low_id, pet_high_id);
