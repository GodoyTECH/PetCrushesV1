# Estratégia de deploy (alvo)

## Frontend — Netlify

### Pré-requisitos
- O frontend está em `client/`.
- O build estático de Netlify usa `netlify.toml` na raiz.

### Configuração aplicada
- `netlify.toml`:
  - `base = "client"`
  - `command = "npm run build"`
  - `publish = "dist"`
- SPA fallback configurado no `netlify.toml` via redirect:
  - `/* -> /index.html (200)`

### Passo a passo no Netlify
1. Criar um novo site no Netlify conectando este repositório.
2. Em **Build settings**, manter:
   - Base directory: `client` (ou deixar o Netlify ler do `netlify.toml`)
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Em **Environment variables**, configurar:
   - `VITE_API_URL=https://<sua-api-no-render>.onrender.com`
4. Fazer deploy.
5. Testar rotas SPA diretamente no browser (sem 404):
   - `/`
   - `/auth`
   - `/app`
   - `/app/match`
   - `/app/chat`

### Variáveis de ambiente frontend
- Obrigatória em modo separado:
  - `VITE_API_URL`
- Não colocar secrets no frontend.

---

## Backend/API — Render (Node service standalone)

### Objetivo desta etapa
- Rodar API como serviço Node no Render sem depender do frontend (`SERVE_CLIENT=false`).
- Usar Neon Postgres via `DATABASE_URL` mantendo Drizzle.

### Configuração recomendada no Render
1. Criar **Web Service** conectando este repositório.
2. Runtime: **Node**.
3. Build command:
   ```bash
   npm run build
   ```
4. Start command:
   ```bash
   npm run start
   ```
5. Health check path:
   ```text
   /api/health
   ```

### Variáveis de ambiente mínimas (Render)
Definir no painel do Render:
- `NODE_ENV=production`
- `SERVE_CLIENT=false`
- `CORS_ORIGIN=https://<seu-site>.netlify.app`
- `DATABASE_URL=postgresql://...` (Neon)
- `SESSION_SECRET=<segredo-forte>`
- `ISSUER_URL=https://replit.com/oidc` (auth atual)
- `REPL_ID=<client_id_oidc_atual>` (auth atual)

Observações:
- `PORT` é injetado pelo Render automaticamente.
- Não expor essas variáveis no frontend.

### Comportamento de produção esperado
- API sobe com `npm run start` usando `dist/index.cjs`.
- Serviço escuta `process.env.PORT`.
- Healthcheck `GET /api/health` responde sem depender de consulta ao banco.

---

## Banco — Neon (Postgres) + Drizzle

### Passo a passo (Neon)
1. Criar projeto no Neon.
2. Copiar a connection string Postgres (`DATABASE_URL`) com SSL.
3. Configurar essa `DATABASE_URL` no Render.

### Migração/schema (Drizzle)
Este repositório usa `drizzle-kit push`:
```bash
npm run db:push
```

Recomendação operacional:
- Executar `npm run db:push` manualmente na primeira publicação (ou via job controlado).
- Evitar rodar push automaticamente a cada boot da API.

---

## Mídia — Cloudinary
- Upload server-side.
- Evitar credenciais no frontend.

## Checklist rápido pós-deploy
1. `GET /api/health` retorna `{ ok: true, name: "petcrushesv2-api" }`.
2. Frontend Netlify consegue consumir API Render com `VITE_API_URL`.
3. Login/fluxo de sessão responde sem erro de cookie/CORS em HTTPS.

## Observação
Sem Prisma nesta etapa. A base permanece em Drizzle + Postgres para reduzir risco durante estabilização de deploy.
