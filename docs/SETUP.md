# Plano de execução (incremental e sem quebra)


## Status da execução

### ETAPA 1 — Estabilização de baseline (concluída)
- Corrigidos erros de TypeScript que bloqueavam o `npm run check`.
- Build de produção validado após correções.
- Nenhuma migração para Prisma nesta etapa (mantido Drizzle para reduzir risco).

## Princípios
- Mudanças mínimas por etapa.
- Cada etapa com validação de build/execução.
- Evitar troca grande de tecnologia de uma vez.

## Etapas

### Etapa 1 — Auditoria e planejamento (concluída)
- Inventário da stack atual.
- Levantamento de riscos.
- Definição de roadmap técnico.

### Etapa 2 — Estabilização técnica
- Corrigir erros de TypeScript (`npm run check`).
- Garantir `.gitignore` e higiene de artefatos.
- Fechar baseline “build + check” consistente.

### Etapa 3 — Preparação de ambiente (Neon/Render/Netlify)
- Padronizar variáveis de ambiente.
- Ajustar backend para execução limpa em Render.
- Definir estratégia de build do frontend para Netlify.

### Etapa 4 — Upload real com Cloudinary
- Implementar serviço de upload no backend.
- Substituir mock de upload por integração real.
- Validar limites, tipos de mídia e retorno de URL segura.

### Etapa 5 — Banco em Neon e estratégia Prisma
- Conectar banco Neon com segurança.
- Introduzir Prisma em paralelo ao Drizzle (sem big-bang).
- Migrar módulos por domínio, com rollback possível.

### Etapa 6 — Deploy profissional
- Publicar frontend no Netlify.
- Publicar API no Render.
- Configurar variáveis, healthcheck e smoke test pós-deploy.

## Critérios de conclusão por etapa
- Build de produção OK.
- Typecheck OK (quando aplicável).
- Documentação atualizada.
