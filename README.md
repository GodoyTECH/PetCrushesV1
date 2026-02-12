
# PetCrushes 🐾💛  
**Matchmaking & Adoção responsável para pets — com chat, filtros e segurança.**  
**MobiPet (em breve): transporte seguro estilo “Uber Pet”.**

## Visão geral
O **PetCrushes** é uma plataforma web (mobile + desktop) que ajuda tutores a encontrarem:
- **pares compatíveis para Cruzamento responsável**
- **companhia**
- **socialização (playdates)**
- além de uma área separada para **Doações/Adoção** (sem qualquer foco em venda)

O objetivo é resolver um problema comum: hoje, muita gente tenta achar pares ou divulgar doações em Marketplace/OLX/grupos, onde há:
- confusão com anúncios de venda,
- baixa visibilidade,
- insegurança e golpes,
- falta de filtros e contexto do pet.

O **PetCrushes** cria um ambiente dedicado e seguro, focado em bem-estar animal e conexões responsáveis.

---

## Finalidade e intenção do app
- Facilitar conexões **entre tutores** com base em informações reais do pet.
- Reduzir perfis falsos com **mídia obrigatória** (mín. 3 fotos + vídeo curto).
- Incentivar **adoção e doação responsável**, com uma seção separada e regras claras.
- Educar com **avisos e mensagens de bem-estar**.
- Preparar base para ecossistema pet (serviços e parcerias).

---

## Diferenciais
✅ **Não é marketplace (venda proibida)**  
O PetCrushes bloqueia automaticamente termos e padrões de venda (R$, “vendo”, “pix”, “valor” etc.) no frontend e backend.

✅ **Doações/Adoção em área separada**  
Evita mistura com “match” e mantém linguagem de adoção responsável.

✅ **Mídia obrigatória para reduzir fakes**  
Cadastro do pet exige:
- mínimo **3 fotos**
- **1 vídeo curto** (>= 5 segundos)

✅ **Match + Chat interno**  
Conversa dentro do app liberada apenas após match e para usuários com pet cadastrado.

✅ **i18n (PT/EN)**  
Preparado para público global.

✅ **Roadmap de mobilidade pet: MobiPet (em breve)**  
Uma aba dedicada a transporte seguro de pets com motoristas/veículos cadastrados.

---

## MobiPet (em desenvolvimento)
A aba **MobiPet** é um módulo futuro (placeholder nesta fase).  
Será um serviço estilo **“Uber Pet”**, com:
- motoristas verificados
- carros adequados para transporte de animais
- agendamento e rotas
- avaliações
- regras de segurança
- (futuro) rastreio e suporte

> **Observação:** nesta versão, MobiPet ainda não implementa transporte — apenas apresenta a visão do módulo.

---

## Possíveis parcerias (exemplos)
O PetCrushes pode evoluir para parcerias com empresas do setor pet, como:
- **Petz** (varejo pet, serviços e adoção)
- **Zee.Dog** (produtos premium e lifestyle pet)
- **Cobasi** (varejo e serviços)
- **GoldeN / PremierPet / Royal Canin / Purina** (alimentação e educação)
- **Clínicas e hospitais veterinários** locais (vacinação, check-ups)
- **ONGs e abrigos** (adoção responsável, campanhas)
- **Creches/Hotéis para pets** (benefícios e cupons)
- **Adestradores e consultores** (treinamento e socialização)

Monetização futura (opcional):
- destaque de perfil por 24h
- selo verificado (premium)
- parcerias e cupons
- anúncios não invasivos (somente serviços pet)

---

## Funcionalidades principais
### Autenticação e contas
- Login por Google / Apple (planejado) e/ou e-mail com OTP
- Sessões com JWT
- Perfil do tutor com região e contatos opcionais

### Cadastro e publicações de pets
- Pets de múltiplas espécies
- Raça com autocomplete + opção “não encontrei”
- Objetivo: Cruzamento / Companhia / Socialização
- Campos importantes: idade, porte, cores, pedigree (obrigatório), saúde
- **Mídia obrigatória:** >=3 fotos + vídeo >=5s

### Feed e filtros
- Feed de “Match” (publicações gerais)
- Feed de “Doações/Adoção” separado
- Filtros: espécie, raça, gênero, objetivo, região
- Paginação (carregar mais)

### Match e Chat
- Like/Match entre tutores
- Chat interno após match
- Regras: só conversa com usuário logado e com pet cadastrado

### Segurança e moderação
- Denúncias (spam, venda, maus-tratos, perfil falso)
- Bloqueio automático de termos de venda
- Avisos legais e de bem-estar

---

## Tecnologias e linguagens
### Frontend (apps/web)
- **React + Vite**
  - Interface do usuário, rotas, telas, componentes, performance
- **TypeScript** (quando aplicado)
  - Tipagem e confiabilidade do código no front
- **Tailwind CSS**
  - Estilização rápida, responsiva e consistente
- **i18n**
  - Traduções PT/EN e alternância de idioma

### Backend/API (apps/api)
- **Node.js (JavaScript/TypeScript)**
  - API REST, autenticação, regras de negócio e validações
- **Express ou Fastify**
  - Servidor HTTP e rotas da API
- **Zod**
  - Validação de payloads e mensagens de erro padronizadas
- **JWT**
  - Sessão segura e autenticação

### Banco de dados (Neon / Postgres)
- **PostgreSQL (Neon)**
  - Persistência de dados: usuários, pets, likes, matches, chat, denúncias
- **Prisma ORM**
  - Models, migrations e queries seguras

### Mídia (Cloudinary)
- **Cloudinary**
  - Upload e entrega de imagens/vídeos com CDN
  - Armazenar no banco apenas URLs e metadados

### Deploy (alvo)
- **Netlify (Frontend)**
- **Render (Backend/API)**
- **Neon (DB Postgres)**
- **Cloudinary (Mídia)**

---

## Estrutura do repositório (sugerida)
- `apps/web` — Frontend React/Vite
- `apps/api` — Backend Node + Prisma
- `packages/shared` — Tipos e validações compartilhadas (opcional)
- `docs/` — Setup e Deploy
