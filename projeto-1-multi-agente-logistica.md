# 🚀 PROJETO 1: Sistema Multi-Agente — Logística

> **Estratégia**: v0.dev para UI/Frontend completo → Claude Code para backend, IA, infra e integrações
> **Padrões globais**: Clean Code, SOLID (SRP focus), Enterprise-grade logging (Pino/Winston), Testes (Vitest + Supertest), TypeScript strict

---

## 🎨 PROMPT v0.dev (Dashboard UI)

```
Crie um dashboard enterprise para sistema de multi-agentes de IA em logística. O app gerencia agentes que fazem triagem de e-mails, geração de relatórios e escalonamento inteligente.

## Tech Stack
- Next.js 14 App Router + TypeScript strict mode
- Tailwind CSS + shadcn/ui components
- Recharts para gráficos
- Lucide React para ícones
- React Hook Form + Zod para formulários

## Páginas e Componentes

### 1. Dashboard Principal (`/dashboard`)
- Header com logo "LogiAgent", breadcrumbs, avatar dropdown e notificações badge
- Cards KPI em grid responsivo: Total de E-mails Processados (hoje/semana/mês), Taxa de Acerto na Triagem (%), Relatórios Gerados, Tickets Escalonados, Tempo Médio de Processamento
- Gráfico de linha (Recharts): volume de e-mails processados por hora nas últimas 24h
- Gráfico de barras: distribuição por categoria de triagem (urgente, rotina, spam, ação-requerida)
- Feed de atividade em tempo real com scroll infinito mostrando últimas ações dos agentes (ícone do agente + timestamp + descrição + status badge)
- Filtros por período (hoje, 7d, 30d, custom range)

### 2. Painel de Agentes (`/agents`)
- Grid de cards para cada agente: "Triagem de E-mails", "Gerador de Relatórios", "Escalonamento"
- Cada card mostra: status (online/offline/processing com dot animado), métricas do agente, último processamento, taxa de sucesso
- Click no card abre drawer lateral com logs detalhados do agente, configurações e histórico
- Botões de ação: Pausar, Reiniciar, Ver Logs, Configurar

### 3. Triagem de E-mails (`/triage`)
- Tabela com DataTable (sorting, filtering, pagination):
  - Colunas: De, Assunto, Categoria (badge colorido), Prioridade (alta/média/baixa), Confiança IA (%), Ação Tomada, Data
- Painel de detalhes ao clicar: preview do e-mail, raciocínio da IA, ações sugeridas vs tomadas
- Filtros: por categoria, prioridade, range de confiança, período
- Bulk actions: re-classificar, aprovar, rejeitar

### 4. Relatórios (`/reports`)
- Lista de relatórios gerados com cards: título, tipo, data, status (gerado/pendente/erro)
- Preview inline do relatório em modal
- Botões: Download PDF, Regenerar, Editar Template
- Formulário para solicitar novo relatório: tipo, período, parâmetros customizáveis

### 5. Escalonamento (`/escalation`)
- Kanban board com colunas: Novo, Em Análise, Escalonado, Resolvido
- Cards draggable com: assunto, prioridade (cor), agente responsável, tempo desde criação
- Timeline de cada ticket mostrando decisões da IA e intervenções humanas
- Regras de escalonamento configuráveis em modal com form

### 6. Configurações (`/settings`)
- Tabs: Geral, Agentes, Integrações, Notificações
- Form de configuração de cada agente: thresholds de confiança, regras de triagem, templates de relatório
- Configuração de SMTP/IMAP para conexão com e-mail
- Webhook URLs e API keys (masked input)

## Design System
- Paleta: fundo dark (#0A0F1C), cards (#111827), accent azul elétrico (#3B82F6), success verde (#10B981), warning amber (#F59E0B), danger vermelho (#EF4444)
- Tipografia: Geist Sans para body, Geist Mono para dados/código
- Border radius: 12px cards, 8px botões, 6px inputs
- Sombras sutis com glow azul em elementos interativos hover
- Animações: fade-in nos cards, skeleton loading, pulse no status "processing"
- Sidebar colapsável com ícones + labels, highlight no item ativo
- 100% responsivo: sidebar vira bottom nav no mobile
- Toast notifications no canto inferior direito
- Empty states com ilustrações SVG inline e CTAs claros
- Breadcrumbs em todas as páginas

## Dados Mock
Gere dados realistas de uma empresa de logística brasileira. Nomes de remetentes brasileiros, assuntos de e-mails sobre entregas, devoluções, atrasos, cotações. Todos os textos em português BR.

## Qualidade de Código
- Componentes pequenos com responsabilidade única (SRP)
- Types/interfaces separados em bloco no topo ou arquivo types.ts
- Custom hooks para lógica reutilizável (useAgentStatus, useTriageFilters, etc)
- Constantes e enums para status, categorias, prioridades
- Nenhum magic number ou string hardcoded
- Comentários JSDoc nos componentes exportados
```

---

## 🤖 PROMPT Claude Code (Backend + Agentes IA)

```
Construa o backend completo do sistema multi-agente de IA para logística. O sistema orquestra agentes que fazem triagem de e-mails, geração de relatórios e escalonamento inteligente.

## Arquitetura & Stack

- **Runtime**: Node.js 20+ com TypeScript strict
- **Framework**: NestJS 10+ (modular, decorators, DI)
- **ORM**: Prisma com PostgreSQL 16
- **Cache/Queue**: Redis + BullMQ para job queue
- **IA**: OpenAI API (GPT-4o) via LangChain.js
- **Logging**: Pino logger com correlation IDs (cls-hooked)
- **Testes**: Vitest + Supertest para e2e, coverage mínimo 80%
- **Containerização**: Dockerfile multi-stage + docker-compose.yml

## Estrutura do Projeto

```
src/
├── main.ts
├── app.module.ts
├── config/
│   ├── app.config.ts          # Validação com Zod
│   ├── database.config.ts
│   └── ai.config.ts
├── common/
│   ├── decorators/
│   ├── filters/               # Global exception filter
│   ├── guards/
│   ├── interceptors/          # Logging interceptor, timeout
│   ├── pipes/                 # Zod validation pipe
│   ├── interfaces/
│   └── utils/
├── modules/
│   ├── auth/                  # JWT auth, API key guard
│   ├── email/
│   │   ├── email.module.ts
│   │   ├── email.controller.ts
│   │   ├── email.service.ts         # SRP: CRUD de e-mails
│   │   ├── email-ingestion.service.ts  # SRP: IMAP polling
│   │   ├── email.repository.ts
│   │   └── dto/
│   ├── agents/
│   │   ├── agents.module.ts
│   │   ├── orchestrator.service.ts     # Orquestra os agentes
│   │   ├── triage-agent.service.ts     # Agente de triagem
│   │   ├── report-agent.service.ts     # Agente de relatórios
│   │   ├── escalation-agent.service.ts # Agente de escalonamento
│   │   ├── agent-registry.service.ts   # Registry pattern
│   │   └── interfaces/
│   │       └── agent.interface.ts      # IAgent contract
│   ├── reports/
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   ├── report-generator.service.ts
│   │   └── templates/
│   ├── escalation/
│   │   ├── escalation.module.ts
│   │   ├── escalation.controller.ts
│   │   ├── escalation.service.ts
│   │   └── rules-engine.service.ts    # Regras configuráveis
│   ├── dashboard/
│   │   ├── dashboard.controller.ts
│   │   └── analytics.service.ts       # Agregações e KPIs
│   └── webhooks/
│       ├── webhooks.controller.ts
│       └── webhooks.service.ts
├── jobs/
│   ├── email-polling.job.ts
│   ├── report-generation.job.ts
│   └── escalation-check.job.ts
└── prisma/
    ├── schema.prisma
    ├── seed.ts
    └── migrations/
```

## Schema Prisma

Modele as seguintes entidades com relacionamentos:
- **Email**: id, from, to, subject, body, rawHeaders (Json), category (enum: URGENT/ROUTINE/SPAM/ACTION_REQUIRED), priority (enum: HIGH/MEDIUM/LOW), confidence (Float), status (enum: PENDING/TRIAGED/ESCALATED/RESOLVED), processedAt, agentDecision (Json), createdAt, updatedAt
- **Agent**: id, name, type (enum: TRIAGE/REPORT/ESCALATION), status (enum: ONLINE/OFFLINE/PROCESSING), config (Json), lastRunAt, totalProcessed, successRate (Float), createdAt
- **Report**: id, title, type, content (Json), status (enum: PENDING/GENERATING/COMPLETED/ERROR), generatedBy (relation Agent), parameters (Json), fileUrl, createdAt
- **EscalationTicket**: id, emailId (relation), subject, priority, status (enum: NEW/ANALYZING/ESCALATED/RESOLVED), assignedTo, aiDecisionLog (Json[]), timeline (Json[]), createdAt, resolvedAt
- **AgentLog**: id, agentId (relation), action, input (Json), output (Json), durationMs, success, error, createdAt
- **Setting**: id, key (unique), value (Json), category, updatedAt

## Implementação dos Agentes

### Interface Base
```typescript
interface IAgent {
  readonly name: string;
  readonly type: AgentType;
  process(input: AgentInput): Promise<AgentOutput>;
  getStatus(): AgentStatus;
  configure(config: AgentConfig): void;
}
```

### Triage Agent
- Recebe e-mail bruto → usa LangChain com structured output (Zod schema) para classificar
- Prompt com few-shot examples de e-mails de logística
- Output: { category, priority, confidence, reasoning, suggestedActions }
- Se confidence < threshold configurável → marca para revisão humana
- Persiste resultado no banco e emite evento via EventEmitter2

### Report Agent
- Recebe parâmetros (tipo, período) → agrega dados do banco
- Usa LLM para gerar sumário executivo e insights
- Gera JSON estruturado que o frontend renderiza
- Jobs agendados via BullMQ cron para relatórios diários/semanais

### Escalation Agent
- Rules engine configurável: condições (prioridade + categoria + keywords)
- Se regra match → cria ticket, notifica via webhook
- Se não match em nenhuma regra → usa LLM como fallback para decidir
- Mantém timeline de decisões para auditoria

### Orchestrator
- Recebe e-mail ingerido → roteia para Triage Agent
- Baseado no resultado da triagem → decide se aciona Report ou Escalation
- Pipeline pattern com error handling em cada step
- Retry com exponential backoff (3 tentativas)
- Dead letter queue para falhas persistentes

## API Endpoints

### Auth
- POST /auth/login → JWT token
- POST /auth/api-key → gera API key

### Dashboard
- GET /dashboard/kpis?period=7d → KPIs agregados
- GET /dashboard/activity?limit=50 → feed de atividades
- GET /dashboard/charts/volume?granularity=hour → dados para gráficos

### Emails
- GET /emails?page=1&limit=20&category=URGENT&sort=createdAt:desc
- GET /emails/:id → detalhes com decisão da IA
- PATCH /emails/:id/reclassify → override manual
- POST /emails/bulk-action → ações em lote

### Agents
- GET /agents → lista todos com status
- GET /agents/:id → detalhes + métricas
- GET /agents/:id/logs?limit=100 → logs paginados
- PATCH /agents/:id/config → atualiza configuração
- POST /agents/:id/restart → reinicia agente

### Reports
- GET /reports?status=COMPLETED → lista com filtros
- GET /reports/:id → detalhes + conteúdo
- POST /reports → solicita novo relatório
- POST /reports/:id/regenerate → regenera

### Escalation
- GET /escalation/tickets?status=NEW → lista com filtros
- GET /escalation/tickets/:id → detalhes + timeline
- PATCH /escalation/tickets/:id/status → move no kanban
- GET /escalation/rules → lista regras
- PUT /escalation/rules → atualiza regras

### Settings
- GET /settings/:category → configurações por categoria
- PUT /settings/:key → atualiza configuração

## Requisitos Não-Funcionais

### Logging (Pino)
- Cada request recebe um correlationId (UUID v4) via middleware
- Formato JSON estruturado: { level, correlationId, module, action, durationMs, metadata }
- Child loggers por módulo: logger.child({ module: 'TriageAgent' })
- Log de entrada e saída de cada método de agente
- Sensitive data redaction (email body truncado, API keys mascaradas)
- Log levels: trace para debug de prompts, info para operações, warn para low confidence, error para falhas

### Error Handling
- Global exception filter que captura e formata erros
- Custom exceptions: AgentProcessingError, TriageConfidenceLowError, etc
- Error response padrão: { statusCode, message, error, correlationId, timestamp }
- Nunca expor stack traces em produção

### Testes
- Unit tests para cada service e agent com mocks (vi.mock)
- Integration tests para controllers com Supertest
- Test fixtures factory pattern para dados de teste
- Testar cenários de edge: e-mail vazio, LLM timeout, confidence 0.0
- Coverage report com Vitest --coverage

### Docker
- Multi-stage Dockerfile: build → prune → runtime (node:20-alpine)
- docker-compose.yml com: app, postgres, redis
- Health check endpoint: GET /health → { status, db, redis, agents }
- .env.example com todas as variáveis documentadas

## Seed Data
Gere seed realista de empresa de logística brasileira. 50+ e-mails com assuntos como: "Atraso na entrega - NF 45892", "Cotação frete SP-RJ 500kg", "Devolução - Produto danificado", "Reentrega urgente - Cliente VIP". Nomes brasileiros, CNPJs, cidades brasileiras.
```
