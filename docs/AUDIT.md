# Etapa 1 — Auditoria do repositório

## 1) Resumo executivo
O projeto já está em base moderna (React/Vite + Node/TS + Zod), porém ainda acoplado a partes do ecossistema Replit e com inconsistências de tipagem que impedem `npm run check` no estado atual.

## 2) Diagnóstico técnico

### 2.1 Arquitetura e build
- Projeto full-stack único (cliente + API no mesmo repositório e mesma execução).
- Build de produção já funciona via `npm run build`.
- `npm run check` (TypeScript) falha atualmente por divergências de tipos e exports.

### 2.2 Frontend
- React + Vite + TypeScript presentes e funcionais.
- Código acoplado a contrato compartilhado (`shared/routes.ts`).

### 2.3 Backend/API
- Express + TypeScript com API REST.
- Sessão e autenticação dependentes de Replit OIDC.
- Upload ainda mockado (retorna URL fixa), sem Cloudinary real.

### 2.4 Banco e ORM
- PostgreSQL com Drizzle ORM.
- Schema e rotas compartilhados em TypeScript.
- Alvo solicitado é Prisma + Neon (migração deve ser gradual, sem quebra).

### 2.5 Deploy
- Ainda sem configuração explícita para Netlify/Render.
- Dependências e plugins de Replit ainda presentes.

### 2.6 Riscos identificados
1. **Typecheck quebrado** no estado atual (dívida técnica imediata).
2. **Acoplamento ao Replit Auth** pode bloquear deploy limpo em Render/Netlify.
3. **Ausência de upload real** (Cloudinary ainda não integrado).
4. **Sem estratégia de migração de ORM documentada** (Drizzle -> Prisma).

## 3) Evidências coletadas
- `npm run build`: **ok**.
- `npm run check`: **falha** com erros de tipagem/export.

## 4) Decisão para migração segura
Executar migração em etapas pequenas:
1. estabilizar baseline (typecheck e documentação);
2. desacoplar infra de Replit para provedores-alvo;
3. integrar Cloudinary;
4. preparar Neon e migração controlada para Prisma;
5. fechar com pipelines de deploy e smoke checks.
