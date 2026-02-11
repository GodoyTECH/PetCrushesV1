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

## Backend/API — Render
- Start command: `npm run start`
- Build command: `npm run build`
- Health endpoint: `GET /api/health`
- Variáveis: `DATABASE_URL`, `SESSION_SECRET`, `PORT`, integrações de auth/upload
- Para API standalone: `SERVE_CLIENT=false`
- Para CORS com frontend Netlify: `CORS_ORIGIN=https://<seu-front>.netlify.app`

## Banco — Neon (Postgres)
- Usar `DATABASE_URL` com `sslmode=require`.
- Aplicar migrations em pipeline controlada.

## Mídia — Cloudinary
- Upload server-side.
- Evitar credenciais no frontend.

## Observação
Este arquivo define o alvo de produção. A implementação detalhada será feita em etapas pequenas e seguras para evitar regressões.
