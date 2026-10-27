<!--
Sync Impact Report
- Version: template → 1.0.0 (primeira ratificação)
- Princípios adicionados: I–VII (todos novos)
- Seções adicionadas: Stack e convenções técnicas; Fluxo de trabalho e entrega; Governança
- Templates revisados: plan-template.md ✅ (Constitution Check lê este arquivo), spec-template.md ✅, tasks-template.md ✅
- Pendências: nenhuma
-->

# Constituição do Campus (course-platform)

Plataforma de cursos (LMS) pessoal, inspirada no Mova. Monorepo com `api/` (NestJS + Prisma) e
`web/` (Angular). Esta constituição vale para toda spec, plano, tarefa e implementação feita com
o spec-kit neste repositório.

## Princípios fundamentais

### I. Arquivos pequenos e focados (INEGOCIÁVEL)
Todo arquivo de código ou estilo tem no máximo 500 linhas, e o alvo é ficar abaixo de 400. Ao
passar disso, o plano DEVE prever a modularização: extrair componentes, partials SCSS
(`web/src/styles/_*.scss`) ou serviços. Arquivos gerados (`src/generated/`, lockfiles) estão fora
da regra.

### II. Código em inglês, produto em português
Identificadores (variáveis, funções, classes, arquivos, branches e commits) são escritos em
inglês. Textos da interface, títulos de PR, issues e documentação para o usuário são em PT-BR.

### III. Reuso antes de criar
Antes de implementar qualquer coisa, o plano DEVE verificar o que já existe em:
- `web/src/app/shared/` (componentes e `utils/`: format, video, http-error, debounced-signal,
  resource, storage);
- `web/src/app/core/` (auth, serviços, modelos);
- `api/src/` (decorators `@Public`/`@Roles`/`@CurrentUser`, `PrismaExceptionFilter`,
  `ProgressService`).

Lógica repetida em dois ou mais lugares vira utilitário compartilhado, com teste próprio.

### IV. Testes com máxima cobertura (INEGOCIÁVEL)
- API: testes unitários (Vitest) para regras de negócio e testes E2E (`api/test/*.e2e-spec.ts`)
  contra o banco `course_platform_test`, que pode ser truncado.
- Web: testes unitários (Vitest via `ng test`) para componentes, serviços e utilitários. A
  cobertura de linhas não pode cair em relação à branch base (hoje fica em torno de 86%).
- Toda mudança no front-end roda os testes de interface (`npm run e2e`, Playwright) nos projetos
  desktop e tablet antes de abrir a PR.
- Bug encontrado vira teste que o reproduz antes da correção.

### V. Acessibilidade, usabilidade e performance por padrão
- WCAG 2 A/AA: toda tela nova ou alterada passa pelo `expectAccessible` (axe) no Playwright, sem
  violações sérias ou críticas, em todos os temas existentes.
- Contraste de texto de no mínimo 4.5:1, foco visível, navegação por teclado, papéis ARIA corretos
  e `prefers-reduced-motion` respeitado.
- Textos de interface no ponto de vista do usuário, com verbos de ação ("Salvar curso") e erros
  que dizem o que aconteceu e como resolver.
- Performance: as rotas usam lazy loading e o bundle inicial do web DEVE ficar abaixo de 100 kB
  gzip (hoje está em ~91 kB).

### VI. Somente tablet e PC
O layout é suportado a partir de 768px de largura (tablet e PC). Layout mobile está fora do
escopo e NÃO deve ser planejado nem testado.

### VII. Simplicidade
Comece pelo mínimo que atende a spec. Novas dependências, camadas ou abstrações precisam de
justificativa na seção "Complexity Tracking" do plano.

## Stack e convenções técnicas

- **API**: NestJS 12 com módulos ESM (imports com sufixo `.js`), Prisma 7 com
  `@prisma/adapter-pg` e PostgreSQL 17 (Docker, porta 5433). Os guards globais (Throttler, JWT e
  Roles) são o padrão; rotas abertas usam `@Public`. Os erros do Prisma passam pelo
  `PrismaExceptionFilter`.
- **Banco**: mudanças de schema só via migration do Prisma. `migrate reset` NÃO é executado por
  agentes; o banco de testes é limpo por `prisma/reset-test-db.ts`, que só aceita bancos com
  sufixo `_test`.
- **Web**: Angular 22 standalone e zoneless, com signals, `rxResource`, `OnPush` e prefixo `cp`.
  Valores de resources são lidos com `valueOf()` no TypeScript e com
  `x.hasValue() && x.value()` nos templates, porque `value()` lança exceção em estado de erro.
- **Estilo**: cores apenas por tokens CSS (`:root`, `html.theme-admin-dark`, `.theme-mova`), sem
  hex fixo em componentes. Área do aluno com o tema Mova; admin com tema próprio e alternância
  claro/escuro.
- **Preferências locais**: `localStorage` só através de `readStoredFlag` e `writeStoredFlag`
  (`shared/utils/storage.ts`), com chaves prefixadas por `cp.`.

## Fluxo de trabalho e entrega

- **Interativo**: antes de codificar, apresente um plano breve e alinhe as dúvidas com o usuário.
  Use `/speckit-clarify` quando a spec tiver ambiguidades. Não entregue tudo de uma vez.
- **Branches e commits** em inglês. Toda entrega é feita por PR em **rascunho (Draft)**.
- **Título da PR** em PT-BR, assertivo, com a versão `#X.Y.Z`:
  - `X`: primeira implementação de uma feature;
  - `Y`: melhoria ou alteração de feature, ou testes;
  - `Z`: pequenas alterações, de até 10 arquivos.
- **Descrição da PR** apenas com: Resumo, Tabela (Implementações + issues associadas), Validação,
  Escopo e Pendências. É **proibido** incluir o link da sessão.
- **Issues**: toda pendência, melhoria ou bug encontrado vira uma issue no GitHub (labels feature,
  enhancement, tests e bug). `/speckit-taskstoissues` pode ser usado para isso.
- **mm-brain**: não se aplica, porque este é um projeto pessoal.

## Governança

Esta constituição prevalece sobre qualquer outra prática do repositório. O "Constitution Check" de
cada `plan.md` DEVE verificar os princípios I a VII, e qualquer violação precisa de justificativa
em "Complexity Tracking". Alterações nesta constituição seguem versionamento semântico (MAJOR
remove ou redefine um princípio, MINOR adiciona, PATCH esclarece) e são feitas por
`/speckit-constitution`, em PR própria.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
