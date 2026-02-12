# Neon/Postgres Schema Inventory (PetCrushesV1)

## [1] INVENTÁRIO DE TABELAS (CANÔNICO)

### table: `users`
- columns:
  - `id` varchar NOT NULL default `gen_random_uuid()`
  - `username` varchar NULL unique
  - `email` varchar NULL unique
  - `first_name` varchar NULL
  - `last_name` varchar NULL
  - `profile_image_url` varchar NULL
  - `display_name` varchar NULL
  - `whatsapp` varchar NULL
  - `region` varchar NULL
  - `verified` varchar NULL
  - `is_admin` varchar NULL
  - `created_at` timestamp NULL default `now()`
  - `updated_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - none
- unique indexes:
  - unique (`username`)
  - unique (`email`)
- other indexes:
  - none declarados no Drizzle
- checks/constraints:
  - nenhuma check declarada

### table: `sessions` (legado)
- columns:
  - `sid` varchar NOT NULL
  - `sess` jsonb NOT NULL
  - `expire` timestamp NOT NULL
- primary key:
  - `sid`
- foreign keys:
  - none
- unique indexes:
  - PK já cobre unicidade de `sid`
- other indexes:
  - `IDX_session_expire` em (`expire`)
- checks/constraints:
  - nenhuma check declarada

### table: `pets`
- columns:
  - `id` serial NOT NULL
  - `owner_id` varchar NOT NULL
  - `display_name` text NOT NULL
  - `species` text NOT NULL
  - `breed` text NOT NULL
  - `gender` text NOT NULL
  - `size` text NULL
  - `colors` text[] NOT NULL
  - `age_months` integer NOT NULL
  - `pedigree` boolean NOT NULL default `false`
  - `vaccinated` boolean NULL default `false`
  - `neutered` boolean NULL default `false`
  - `health_notes` text NULL
  - `objective` text NOT NULL
  - `is_donation` boolean NULL default `false`
  - `region` text NOT NULL
  - `about` text NOT NULL
  - `photos` text[] NOT NULL
  - `video_url` text NOT NULL
  - `created_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - `owner_id -> users(id)`
- unique indexes:
  - none
- other indexes:
  - nenhum índice explícito no Drizzle
- checks/constraints:
  - enum lógico em código para `gender`: MALE/FEMALE
  - enum lógico em código para `size`: SMALL/MEDIUM/LARGE
  - enum lógico em código para `objective`: BREEDING/COMPANIONSHIP/SOCIALIZATION

### table: `likes`
- columns:
  - `id` serial NOT NULL
  - `liker_pet_id` integer NOT NULL
  - `target_pet_id` integer NOT NULL
  - `created_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - `liker_pet_id -> pets(id)`
  - `target_pet_id -> pets(id)`
- unique indexes:
  - nenhum no Drizzle (recomendado unique composto)
- other indexes:
  - nenhum índice explícito no Drizzle
- checks/constraints:
  - recomendável `CHECK (liker_pet_id <> target_pet_id)`

### table: `matches`
- columns:
  - `id` serial NOT NULL
  - `pet_a_id` integer NOT NULL
  - `pet_b_id` integer NOT NULL
  - `created_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - `pet_a_id -> pets(id)`
  - `pet_b_id -> pets(id)`
- unique indexes:
  - nenhum no Drizzle (recomendado unique de par canônico)
- other indexes:
  - nenhum índice explícito no Drizzle
- checks/constraints:
  - recomendável `CHECK (pet_a_id <> pet_b_id)`

### table: `messages`
- columns:
  - `id` serial NOT NULL
  - `match_id` integer NOT NULL
  - `sender_id` varchar NOT NULL
  - `content` text NOT NULL
  - `created_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - `match_id -> matches(id)`
  - `sender_id -> users(id)`
- unique indexes:
  - none
- other indexes:
  - nenhum índice explícito no Drizzle
- checks/constraints:
  - nenhuma check declarada

### table: `reports`
- columns:
  - `id` serial NOT NULL
  - `reporter_id` varchar NOT NULL
  - `target_pet_id` integer NOT NULL
  - `reason` text NOT NULL
  - `status` text NULL default `'PENDING'`
  - `created_at` timestamp NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - `reporter_id -> users(id)`
  - `target_pet_id -> pets(id)`
- unique indexes:
  - none
- other indexes:
  - nenhum índice explícito no Drizzle
- checks/constraints:
  - enum lógico em código para `status`: PENDING/RESOLVED/DISMISSED

### table: `otp_codes`
- columns:
  - `id` uuid NOT NULL default `gen_random_uuid()`
  - `email` text NOT NULL
  - `code_hash` text NOT NULL
  - `expires_at` timestamp NOT NULL
  - `attempts` integer NOT NULL default `0`
  - `used_at` timestamp NULL
  - `created_at` timestamp NOT NULL default `now()`
- primary key:
  - `id`
- foreign keys:
  - none
- unique indexes:
  - none
- other indexes:
  - `otp_codes_email_idx` em (`email`)
  - `otp_codes_created_at_idx` em (`created_at`)
- checks/constraints:
  - nenhuma check declarada

---

### Tabela `users` final esperada (backend + frontend)
Para o app funcionar hoje sem erro de coluna faltando em autenticação e UI, `users` precisa ter:
- obrigatórias para fluxo atual:
  - `id`, `email`, `username`, `verified`
- necessárias para leitura/render no frontend:
  - `first_name`, `profile_image_url` (usadas na Sidebar)
- necessárias para schema/tipos e seeds atuais:
  - `display_name`, `whatsapp`, `region`, `last_name`, `is_admin`, `created_at`, `updated_at`

## [2] COLUNAS EM FALTA / RISCO DE “DOES NOT EXIST”

### Se o banco estiver desatualizado em relação ao código

#### `users`
- risco: `column users.username does not exist`
  - referência: busca por username no storage e criação no OTP. (`server/storage.ts`, `server/auth.ts`)
- risco: `column users.first_name does not exist`
  - referência: frontend usa `user.firstName` (mapeia para coluna `first_name`). (`client/src/components/Navigation.tsx`)
- risco: `column users.profile_image_url does not exist`
  - referência: frontend usa `user.profileImageUrl`. (`client/src/components/Navigation.tsx`)
- risco: `column users.verified does not exist`
  - referência: OTP define e atualiza `verified` em login. (`server/auth.ts`)
- risco: `column users.display_name/whatsapp/region does not exist`
  - referência: seed grava esses campos. (`server/routes.ts`)

#### `otp_codes`
- risco: `relation "otp_codes" does not exist`
  - referência: request/verify OTP dependem dessa tabela para create/select/update. (`server/storage.ts`, `server/auth.ts`)
- risco de coluna faltando em OTP:
  - `email`, `code_hash`, `expires_at`, `attempts`, `used_at`, `created_at`

#### `pets` / `likes` / `matches` / `messages` / `reports`
- risco de relation inexistente nessas rotas:
  - listar/criar pets, likes, matches, mensagens e reports usam diretamente essas tabelas via storage. (`server/routes.ts`, `server/storage.ts`)

### Tabelas referenciadas no código que não existem no schema Drizzle
- nenhuma. Todas as tabelas usadas em queries estão definidas como `pgTable` (`users`, `sessions`, `pets`, `likes`, `matches`, `messages`, `reports`, `otp_codes`).

## [3] SCRIPT SQL GERADO (safe para Neon)

> Sem `DROP`, com `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS`.

```sql
-- Recomendado antes: habilitar extensão para UUID randômico
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- A) Tabelas-base sem dependência
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar,
  email varchar,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  display_name varchar,
  whatsapp varchar,
  region varchar,
  verified varchar,
  is_admin varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

-- B) Tabelas dependentes
CREATE TABLE IF NOT EXISTS pets (
  id serial PRIMARY KEY,
  owner_id varchar NOT NULL REFERENCES users(id),
  display_name text NOT NULL,
  species text NOT NULL,
  breed text NOT NULL,
  gender text NOT NULL,
  size text,
  colors text[] NOT NULL,
  age_months integer NOT NULL,
  pedigree boolean NOT NULL DEFAULT false,
  vaccinated boolean DEFAULT false,
  neutered boolean DEFAULT false,
  health_notes text,
  objective text NOT NULL,
  is_donation boolean DEFAULT false,
  region text NOT NULL,
  about text NOT NULL,
  photos text[] NOT NULL,
  video_url text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  id serial PRIMARY KEY,
  liker_pet_id integer NOT NULL REFERENCES pets(id),
  target_pet_id integer NOT NULL REFERENCES pets(id),
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id serial PRIMARY KEY,
  pet_a_id integer NOT NULL REFERENCES pets(id),
  pet_b_id integer NOT NULL REFERENCES pets(id),
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  match_id integer NOT NULL REFERENCES matches(id),
  sender_id varchar NOT NULL REFERENCES users(id),
  content text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id serial PRIMARY KEY,
  reporter_id varchar NOT NULL REFERENCES users(id),
  target_pet_id integer NOT NULL REFERENCES pets(id),
  reason text NOT NULL,
  status text DEFAULT 'PENDING',
  created_at timestamp DEFAULT now()
);

-- C) ALTERs para bancos já existentes (users é o principal risco)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- D) Índices/constraints recomendados
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(email);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON otp_codes(email);
CREATE INDEX IF NOT EXISTS otp_codes_created_at_idx ON otp_codes(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS likes_unique_pair_idx ON likes(liker_pet_id, target_pet_id);
CREATE INDEX IF NOT EXISTS likes_target_pet_id_idx ON likes(target_pet_id);
CREATE INDEX IF NOT EXISTS matches_pet_a_id_idx ON matches(pet_a_id);
CREATE INDEX IF NOT EXISTS matches_pet_b_id_idx ON matches(pet_b_id);
CREATE INDEX IF NOT EXISTS messages_match_id_created_at_idx ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS reports_target_pet_id_idx ON reports(target_pet_id);
CREATE INDEX IF NOT EXISTS reports_reporter_id_idx ON reports(reporter_id);

-- CHECKS opcionais (evitam lixo sem quebrar fluxo)
DO $$ BEGIN
  ALTER TABLE likes ADD CONSTRAINT likes_no_self_like_chk CHECK (liker_pet_id <> target_pet_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE matches ADD CONSTRAINT matches_no_self_match_chk CHECK (pet_a_id <> pet_b_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE reports ADD CONSTRAINT reports_status_chk CHECK (status IN ('PENDING','RESOLVED','DISMISSED'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pets ADD CONSTRAINT pets_gender_chk CHECK (gender IN ('MALE','FEMALE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pets ADD CONSTRAINT pets_size_chk CHECK (size IS NULL OR size IN ('SMALL','MEDIUM','LARGE'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE pets ADD CONSTRAINT pets_objective_chk CHECK (objective IN ('BREEDING','COMPANIONSHIP','SOCIALIZATION'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

## Checklist de migração manual (Neon SQL Editor)

1. Execute bloco de extensão + `CREATE TABLE IF NOT EXISTS` para `users`, `sessions`, `otp_codes`.
2. Execute bloco de `CREATE TABLE IF NOT EXISTS` dependentes (`pets`, `likes`, `matches`, `messages`, `reports`).
3. Execute todos os `ALTER TABLE users ADD COLUMN IF NOT EXISTS` para corrigir bancos antigos.
4. Execute índices e constraints recomendados.
5. (Opcional) seed mínimo:
   - não é obrigatório para login OTP.
   - só necessário para demo local (em produção o seed não roda).

## Validação final de capacidade por endpoint
- `request-otp`: depende de `otp_codes` completo + `count/index por email`.
- `verify-otp`: depende de `otp_codes` + `users(email, username, verified, id)`.
- `/api/auth/me`: depende de `users` e leitura por `id`.
- listar/criar pets: depende de `pets` + FK `owner_id -> users(id)`.
- likes/matches/messages: depende de `likes`, `matches`, `messages` + FKs para `pets/users`.

## Sem shell no Render: como aplicar
- Faça commit deste inventário no repositório (documentação).
- Abra Neon SQL Editor e execute o SQL por blocos na ordem do checklist.
- Não precisa `drizzle push` para desbloquear produção se você criar as tabelas/colunas manualmente.
- Opcionalmente depois você pode alinhar migrations no repo para evitar drift futuro.

## Resumo objetivo
**O mínimo para destravar login agora é:** garantir `otp_codes` existente e `users` com pelo menos `id`, `email`, `username`, `verified` (idealmente já criar todas as colunas listadas para não quebrar frontend e seeds).
