# Etapa 0 — Análise Técnica Inicial (Frontend + Backend)

Status: concluída sem alteração funcional.

## Objetivo 1 — Analisar frontend e backend

### Frontend (React + Vite)
- O frontend usa React + TypeScript com roteamento por `wouter` e cache de dados via `@tanstack/react-query`.
- A tela de autenticação atual usa fluxo único por OTP (e-mail + código), sem separação explícita entre “Entrar” e “Cadastrar”.
- A persistência de sessão no cliente já existe via `localStorage` com chave `petcrushes_token`.
- Existe infraestrutura inicial de i18n (`useLanguage`), mas o uso de textos ainda está inconsistente (mistura PT/EN).

### Backend (Express + Drizzle)
- A API expõe rotas para autenticação OTP, pets, likes, matches, mensagens, reports e upload de mídia.
- O backend valida entrada com Zod em pontos críticos, mas alguns handlers ainda devolvem mensagens técnicas diretamente para o cliente.
- O armazenamento usa PostgreSQL com Drizzle ORM.

## Objetivo 2 — Verificar Cloudinary
- Upload é feito no backend (`/api/media/upload`) usando assinatura server-side.
- Se as variáveis de ambiente Cloudinary não estiverem configuradas, a API retorna erro `503` com mensagem de falha.
- Pontos positivos: validação de tipo (imagem/vídeo) e tamanho máximo por tipo de arquivo.
- Risco identificado: o texto de erro retornado ao frontend pode carregar detalhes técnicos do provedor.

## Objetivo 3 — Verificar match
- O like é criado e, se houver reciprocidade, gera match.
- Não existe restrição única no banco para impedir duplicidade de match em corrida concorrente (requisições simultâneas).
- O frontend de match está em modo MVP e usa `myPetId = 1` fixo, o que pode gerar comportamento incorreto em produção.

## Objetivo 4 — Verificar chat
- O backend retorna mensagens ordenadas por `createdAt`.
- O frontend de chat simplifica o “pet do outro lado” (`otherPet = match.petA`) e pode exibir interlocutor errado em parte dos casos.
- O envio de mensagens bloqueia palavras proibidas no cliente e também no servidor (bom para segurança), porém mensagens e labels de UI ainda não estão totalmente internacionalizadas.

## Objetivo 5 — Verificar autenticação
- Fluxo atual: `request-otp` + `verify-otp` + JWT Bearer.
- A sessão persiste no frontend com token em `localStorage`.
- Ainda não há endpoint de verificação de existência de e-mail (`GET /auth/exists?email=`).
- Usuário novo é criado no `verifyOtp` com `username = email`, sem onboarding obrigatório inicial.

## Objetivo 6 — Listar riscos técnicos internos
1. **Risco de duplicidade de match** por falta de constraint única no banco para pares de pets.
2. **Risco de UX incorreta no match** por `myPetId` fixo no frontend.
3. **Risco de interlocutor incorreto no chat** por lógica simplificada de seleção de `otherPet`.
4. **Risco de exposição de mensagem técnica** em erros de upload/autenticação mostrados ao usuário final.
5. **Risco de onboarding incompleto**: perfil de usuário e pet ainda não cobre todos os campos obrigatórios da visão de produto.
6. **Risco de inconsistência de idioma** devido a textos hardcoded em PT/EN fora do dicionário.

## Escopo das próximas etapas (sem implementação nesta PR)
- **Etapa 1**: autenticação profissional (separar entrar/cadastrar, endpoint exists, mensagens humanas, sessão e reuso de validação).
- **Etapa 2**: onboarding obrigatório de usuário no primeiro login (com SQL separado somente se faltar coluna).
- **Etapa 3**: formulário de pet completo (com SQL separado somente se faltar coluna).
- **Etapa 4**: robustez de match/chat + ajustes Cloudinary + logs apenas no backend.
- **Etapas 5–8**: adoção, MobPet branding, i18n completo, e compartilhamento social profissional.
