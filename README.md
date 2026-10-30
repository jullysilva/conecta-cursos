# Conecta Cursos — plataforma de cursos

LMS corporativo inspirado no Mova (engenharia reversa das rotas, da API e do CSS públicos).
A área do aluno segue o design do Mova (tema escuro, header fixo com barra de progresso, banner em
tela cheia e carrosséis de cards em pôster), com o nome e a logo do Conecta Cursos. O painel admin usa os
verdes da logo, escuro por padrão, com alternância para o claro. Suporte a **celular (a partir de 360px), tablet e PC** na área do aluno e no login; o painel
admin é para **tablet e PC**.

| Pasta | Stack |
|---|---|
| `api/` | NestJS 12, Prisma 7 + PostgreSQL 17, JWT (access em memória + refresh em cookie httpOnly com rotação) |
| `web/` | Angular 22 (standalone, signals, zoneless), SCSS, Remixicon |
| `compose.yaml` | PostgreSQL em `localhost:5433` (cria `course_platform` e `course_platform_test`) |

## Como rodar

```bash
docker compose up -d                    # banco
cd api && cp .env.example .env && npm i
npm run db:deploy && npm run db:seed    # schema + dados de demonstração
npm run start:dev                       # API em http://localhost:3100/api
cd ../web && npm i && npm start         # web em http://localhost:4300 (proxy /api → 3100)
```

Contas do seed: `admin@cursos.local` / `Admin@123` e `aluno@cursos.local` / `Aluno@123`.
E-mails de recuperação de senha vão para o SMTP configurado (padrão: MailHog em `localhost:1025`).

## Testes

| Comando | O que roda |
|---|---|
| `api: npm test` | Unitários (utils, guards) |
| `api: npm run test:e2e` / `test:e2e:cov` | E2E HTTP contra `course_platform_test` |
| `web: npm test` / `test:cov` | Unitários e de componentes (Vitest + jsdom) |
| `web: npm run e2e` | Interface com Playwright + axe (WCAG A/AA), em PC e tablet, numa stack isolada (API :3101 + web :4301 + banco de teste reseedado) |

O reset do banco de teste (`api/prisma/reset-test-db.ts`) recusa qualquer banco cujo nome não termine em `_test`.

## CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda em toda PR para a `main` e a cada push na `main`:

| Job | O que faz |
|---|---|
| API | oxlint, `tsc`, testes unitários com cobertura, E2E contra Postgres 17 de serviço e build |
| Web | testes unitários com cobertura, build de produção e limite de 100 kB (brotli) no bundle inicial (`web/scripts/check-bundle-size.mjs`) |
| Interface | Playwright em PC, tablet e celular com axe; só roda quando a mudança toca `web/` ou o workflow. No CI usa o Google Chrome que já vem no runner. Em caso de falha, o relatório fica como artefato |
| Deploy | Só na `main`, depois dos outros jobs: `prisma migrate deploy` no banco de produção, `scripts/build-vercel-output.mjs` e `vercel deploy --prebuilt --prod` |

## Deploy (Vercel)

Site e API ficam no mesmo projeto Vercel e no mesmo domínio: o Angular é servido como arquivos estáticos e `/api/*` vai para uma Vercel Function (`api/src/vercel.ts`) com a API NestJS empacotada pelo esbuild (região `gru1`, São Paulo). O banco é um Postgres Neon instalado pelo Marketplace do Vercel.

Configuração única:

1. **Projeto:** no Vercel, crie um projeto vazio (sem conectar o Git) e anote o *Project ID* e o *Team/Org ID* (Settings → General).
2. **Banco:** em Storage, instale o Neon na região São Paulo e conecte ao projeto; ele cria `DATABASE_URL` e `DATABASE_URL_UNPOOLED`.
3. **Variáveis do projeto** (Settings → Environment Variables, Production): `JWT_ACCESS_SECRET` (aleatório, ex.: `openssl rand -base64 48`) e `WEB_URL` (URL de produção, ex.: `https://conecta-cursos.vercel.app`).
4. **Token:** em Account Settings → Tokens, crie um token para o GitHub Actions.
5. **Secrets do GitHub** (Settings → Secrets and variables → Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` e `PRODUCTION_DATABASE_URL` (o valor de `DATABASE_URL_UNPOOLED`, usado nas migrations).
6. **Primeiro admin**, depois do primeiro deploy (que cria as tabelas). O seed tem senhas públicas e não roda em produção:

```bash
cd api
ADMIN_NAME="Seu nome" ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='senha com 12+ caracteres' \
DATABASE_URL='<DATABASE_URL_UNPOOLED>' npm run db:create-admin
```

Para testar o build da Vercel localmente: `node scripts/build-vercel-output.mjs` gera `.vercel/output`.

## Spec-driven development (spec-kit)

O projeto usa o [GitHub Spec Kit](https://github.com/github/spec-kit). Os princípios ficam em
`.specify/memory/constitution.md`, e cada feature ganha sua pasta em `specs/NNN-nome/`. No
Claude Code, o fluxo é:

1. `/speckit-specify <descrição>`: escreve a spec, o que e por quê;
2. `/speckit-clarify` (opcional): tira dúvidas antes do plano;
3. `/speckit-plan`: gera o plano técnico, com checagem da constituição;
4. `/speckit-tasks`: gera as tarefas; `/speckit-analyze` (opcional) confere a consistência;
5. `/speckit-implement`: executa as tarefas; `/speckit-taskstoissues` cria as issues.

## Funcionalidades

**Aluno:** login, recuperação e redefinição de senha; home com banner em carrossel, "Continue assistindo"
(ou "Recomendados para você"), curso em destaque e um carrossel por categoria, com detalhes do curso
ao clicar no pôster; header com atalhos para as categorias e progresso geral; página do curso com módulos e aulas; player (YouTube, Vimeo,
Panda ou arquivo .mp4) com progresso salvo, inclusive ao fechar a aba (`sendBeacon`); trilhas; meu progresso.

**Admin (`/adm`):** visão geral; cursos com editor de módulos e aulas (criar, editar, mover, reordenar,
excluir); categorias; trilhas com cursos ordenados; banners com janela de exibição; usuários (perfil, ativação).

## Mapa da API

- `auth`: `POST login | refresh | logout | forgot-password | reset-password`, `GET me`
- `portal`: `GET banners | categories | featured-course | learning-paths`
- `student`: `GET summary | courses/:id | lessons/:id | learning-paths/:id`, `PUT lessons/:id/progress`, `POST lessons/:id/progress/beacon`
- `admin`: `dashboard`, CRUD de `users`, `categories`, `courses` (+ `modules`, `lessons`, reordenação), `learning-paths`, `banners`
