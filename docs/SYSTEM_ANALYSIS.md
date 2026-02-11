# Análise completa do sistema (estado atual)

## 1) Visão geral
O projeto está funcional em partes, com build de produção operacional, mas ainda em estado de transição e com débitos técnicos relevantes para deploy profissional.

### Stack identificada
- Frontend: React + Vite + TypeScript.
- Backend: Node.js + Express + TypeScript.
- Banco: PostgreSQL com Drizzle ORM.
- Validação: Zod.
- Autenticação: Replit OIDC + sessão em Postgres.

## 2) O que já está bom
1. **Base moderna e adequada ao objetivo** (React/Vite/TS + Node/TS + Zod).
2. **Build de produção funciona** com geração de client + bundle de server.
3. **Contrato de API centralizado** em `shared/routes.ts`, facilitando evolução do FE/BE.
4. **Modelagem de domínio principal existe** (pets, likes, matches, messages, reports).

## 3) Principais problemas a corrigir

## P0 — bloquearam qualidade mínima / deploy confiável

### P0.1 Typecheck quebrado
`npm run check` falha com erros de tipos/export, incluindo:
- imports de tipos inexistentes em `@shared/routes` usados no frontend;
- divergência de tipos `string` x `number` em chat/dashboard;
- export/types inconsistentes em storage/schema;
- referência a símbolo não importado (`MessageCircle`).

**Impacto**: impede baseline confiável para continuar migração com segurança.

### P0.2 Contratos de tipo duplicados e desalinhados
- Alguns tipos de request/response estão em `shared/schema.ts`, enquanto hooks buscam tipos em `shared/routes.ts`.
- Isso gera erro de compilação e fragilidade de manutenção.

**Impacto**: quebra de build/check e alto risco de regressão.

### P0.3 Auth acoplada ao Replit
- Login agora usa OTP por e-mail + JWT stateless, sem dependência de provedor externo específico.
- Backend depende de tabela `sessions` e estratégia dinâmica por host.

**Impacto**: risco na migração para Render + Netlify se domínio/fluxo não for cuidadosamente adaptado.

## P1 — importantes para produção

### P1.1 Upload ainda mockado
- Endpoint de upload retorna URL fixa (mock) e não envia mídia real.

**Impacto**: requisito de produto (Cloudinary) não atendido.

### P1.2 Endpoints sem hardening completo
- Existem comentários TODO de ownership/segurança em rotas de update/delete/likes.
- Falta endpoint de healthcheck operacional para deploy.

**Impacto**: risco de segurança/autorização e observabilidade fraca em produção.

### P1.3 Inconsistências de schema de usuário
- Campos como `verified` e `isAdmin` estão tipados como `varchar` na tabela de usuários.
- Para domínio de negócio, o esperado seria `boolean` (com migração segura).

**Impacto**: validação fraca e potenciais bugs de lógica.

## P2 — melhorias de qualidade/performance

### P2.1 Bundle frontend grande
- build aponta chunk principal acima de 500KB minificado.

### P2.2 Documentação de operação ainda inicial
- Há docs de roadmap/deploy, porém faltam playbooks operacionais (rollback/checklist pós-deploy).

## 4) Diagnóstico por camada

### Frontend
- Estrutura geral está organizada (páginas, hooks, UI components).
- Problema central: contratos de tipo não estão alinhados 100% com shared.
- Fluxo de auth está definido em OTP + JWT stateless (`/api/auth/request-otp`, `/api/auth/verify-otp`, `/api/auth/me`).

### Backend/API
- Rotas de domínio cobrem o núcleo do produto.
- Erros tratados de forma básica; faltam padronização robusta de erro e hardening de autorização em alguns endpoints.
- Upload ainda não integrado ao Cloudinary.

### Banco/ORM
- Drizzle já operacional.
- Migração para Prisma deve ser por coexistência temporária (sem big-bang).

### Deploy
- Ainda sem configuração final de infraestrutura para Netlify/Render.
- Falta healthcheck explícito e checklist de readiness.

## 5) O que precisa arrumar agora (ordem recomendada)

1. **Fechar baseline técnico (P0)**
   - corrigir todos os erros de `npm run check`;
   - unificar origem dos tipos compartilhados (`shared/routes.ts` vs `shared/schema.ts`);
   - garantir build + check verdes no CI local.

2. **Preparar deploy seguro (P0/P1)**
   - adicionar endpoint `/api/health`;
   - definir variáveis por ambiente e revisar sessão/cookies para Netlify+Render;
   - manter auth atual funcionando enquanto prepara desacoplamento.

3. **Implementar Cloudinary (P1)**
   - trocar upload mock por upload server-side real;
   - validar tamanho/tipo de arquivo;
   - retornar URL segura e persistir metadados necessários.

4. **Neon + estratégia Prisma incremental (P1)**
   - conectar Neon com segurança (`sslmode=require`);
   - introduzir Prisma em paralelo a Drizzle, migrando por domínio.

5. **Hardening e observabilidade (P1/P2)**
   - corrigir checks de ownership/autorização faltantes;
   - melhorar logs/erros e checklist operacional.

## 6) Definição de pronto da próxima etapa
A próxima etapa deve terminar com:
- `npm run check` sem erros;
- `npm run build` OK;
- documentação atualizada com decisões tomadas na correção de baseline.
