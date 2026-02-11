# PetCrushesV1

Etapa 1 concluída: auditoria técnica inicial e plano de migração incremental para deploy profissional.

## Stack atual (auditada)
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- ORM/DB: Drizzle ORM + PostgreSQL
- Validação: Zod
- Auth: integração Replit OIDC

## Objetivo de destino
- Frontend: Netlify
- Backend/API: Render
- Banco: Neon (Postgres)
- Mídia: Cloudinary
- ORM alvo: Prisma (migração gradual e segura)

## Documentação
- Auditoria: `docs/AUDIT.md`
- Análise completa atual: `docs/SYSTEM_ANALYSIS.md`
- Plano de execução: `docs/SETUP.md`
- Guia de deploy: `docs/DEPLOY.md`

## Comandos
```bash
npm install
npm run dev
npm run build
npm run check
```


## Status técnico atual
- `npm run check`: ✅
- `npm run build`: ✅
- ORM atual: Drizzle (Prisma adiado para etapa futura, após estabilidade)
