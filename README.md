# Campus — plataforma de cursos

LMS corporativo inspirado no Mova (engenharia reversa das rotas, da API e do CSS públicos).
A área do aluno segue o design do Mova (tema escuro, header fixo com barra de progresso, banner em
tela cheia e carrosséis de cards em pôster), com nome e logotipo próprios. O painel admin mantém
o tema claro. Suporte a **PC e tablet** (sem layout mobile).

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
