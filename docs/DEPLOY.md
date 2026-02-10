# Estratégia de deploy (alvo)

## Frontend — Netlify
- Build command: `npm run build`
- Publish directory: `dist/public`
- Variáveis necessárias: endpoints públicos da API

## Backend/API — Render
- Start command: `npm run start`
- Build command: `npm run build`
- Health endpoint: sugerido `GET /api/health` (a implementar)
- Variáveis: `DATABASE_URL`, `SESSION_SECRET`, `PORT`, integrações de auth/upload

## Banco — Neon (Postgres)
- Usar `DATABASE_URL` com `sslmode=require`.
- Aplicar migrations em pipeline controlada.

## Mídia — Cloudinary
- Upload server-side.
- Evitar credenciais no frontend.

## Observação
Este arquivo define o alvo de produção. A implementação detalhada será feita nas próximas etapas para manter mudanças pequenas e seguras.
