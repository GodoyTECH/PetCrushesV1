CREATE TABLE IF NOT EXISTS adoption_posts (
  id serial PRIMARY KEY,
  owner_id varchar NOT NULL REFERENCES users(id),
  name text NOT NULL,
  species text NOT NULL,
  breed text NOT NULL,
  age_label text NOT NULL,
  country text NOT NULL,
  state text NOT NULL,
  city text NOT NULL,
  pedigree boolean NOT NULL DEFAULT false,
  neutered boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  contact text NOT NULL,
  status text NOT NULL DEFAULT 'DISPONIVEL',
  photos text[] NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS adoption_posts_owner_idx ON adoption_posts(owner_id);
CREATE INDEX IF NOT EXISTS adoption_posts_status_idx ON adoption_posts(status);
CREATE INDEX IF NOT EXISTS adoption_posts_created_at_idx ON adoption_posts(created_at DESC);
