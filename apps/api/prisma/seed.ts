import {
  PrismaClient,
  AgentType,
  AgentStatus,
  EmailCategory,
  EmailPriority,
  EmailStatus,
  ReportStatus,
  EscalationTicketStatus,
} from '@prisma/client';
import { fakerPT_BR as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Não apagar credenciais de login do seed de auth. */
const PRESERVE_SETTING_PREFIX = 'auth:';

const SUBJECTS = [
  'Atraso na entrega — NF {nf} — {city}',
  'Cotação frete {origin}-{dest} — {weight} kg',
  'Devolução autorizada — pedido #{num}',
  'Reentrega urgente — cliente contrato corporativo',
  'Agendamento de coleta — CD São Paulo',
  'Fatura divergente — conferência CT-e',
  'Sinistro transporte — mercadoria avariada',
  'SLA fora do acordado — rota Sul',
  'Atualização de status — AWB internacional',
  'Solicitação de POD digital — {city}',
  'Proposta de frete spot — {weight} ton',
  'Bloqueio sistêmico — integração TMS',
  'Contestação de valor de pedágio',
  'Liberação de carga bloqueada fiscalmente',
  'E-mail automático: confirmação de entrega',
  'Follow-up cotação Rio–Salvador',
  'Reclamação B2B — prazo comercial',
  'Documentação ANVISA pendente',
  'Redespacho cancelado — replanejamento',
  'Inspeção veicular agendada — filial Curitiba',
];

const BODY_PARAS = [
  'Prezados, segue situação para análise e providências.',
  'Dados do embarque: transportadora {carrier}, previsão original {date}.',
  'Solicitamos retorno com prazo estimado e plano de ação.',
  'Em anexo histórico de ocorrências e prints do rastreamento.',
  'CNPJ do tomador: {cnpj}. Ref. do pedido comercial interno #{num}.',
  'Favor priorizar devido impacto em linha de produção do cliente.',
  'Aguardamos confirmação de recebimento e assinatura digital do canhoto.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(faker.number.float({ min: 0, max: 1 }) * arr.length)]!;
}

function formatSubject(tpl: string): string {
  return tpl
    .replace('{nf}', String(faker.number.int({ min: 10000, max: 99999 })))
    .replace('{city}', faker.location.city())
    .replace('{origin}', faker.location.city())
    .replace('{dest}', faker.location.city())
    .replace('{weight}', String(faker.number.int({ min: 12, max: 24000 })));
}

function formatBody(): string {
  const paras = faker.helpers.arrayElements(BODY_PARAS, { min: 2, max: 4 });
  return paras
    .join('\n\n')
    .replace('{carrier}', faker.company.name())
    .replace('{date}', faker.date.recent({ days: 14 }).toLocaleDateString('pt-BR'))
    .replace('{cnpj}', `${faker.string.numeric(2)}.${faker.string.numeric(3)}.${faker.string.numeric(3)}/0001-${faker.string.numeric(2)}`)
    .replace('{num}', String(faker.number.int({ min: 1, max: 999999 })));
}

const STATUS_DISTRIBUTION: EmailStatus[] = [
  ...Array(12).fill(EmailStatus.PENDING),
  ...Array(22).fill(EmailStatus.TRIAGED),
  ...Array(10).fill(EmailStatus.ESCALATED),
  ...Array(16).fill(EmailStatus.RESOLVED),
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(faker.number.float({ min: 0, max: 1 }) * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

async function main() {
  faker.seed(20260326);

  console.log('Limpando dados de demo (mantendo settings auth:*)...');

  await prisma.agentLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.escalationTicket.deleteMany();
  await prisma.email.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany({
    where: { key: { not: { startsWith: PRESERVE_SETTING_PREFIX } } },
  });

  const e2eHash = await bcrypt.hash('E2E_test_password_8', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'e2e@logiagent.local',
      passwordHash: e2eHash,
      name: 'E2E User',
    },
  });
  const ownerId = owner.id;

  const agentDefs = [
    {
      name: 'Triagem de E-mails Corporativos',
      type: AgentType.TRIAGE,
      status: AgentStatus.ONLINE,
      totalProcessed: 12407,
      successRate: 97.2,
    },
    {
      name: 'Gerador de Relatórios Operacionais',
      type: AgentType.REPORT,
      status: AgentStatus.PROCESSING,
      totalProcessed: 892,
      successRate: 94.5,
    },
    {
      name: 'Escalonamento Inteligente N1',
      type: AgentType.ESCALATION,
      status: AgentStatus.OFFLINE,
      totalProcessed: 156,
      successRate: 91.0,
    },
    {
      name: 'Análise Documental & Compliance',
      type: AgentType.TRIAGE,
      status: AgentStatus.PROCESSING,
      totalProcessed: 3401,
      successRate: 96.8,
    },
    {
      name: 'Suporte a Operações & SLA',
      type: AgentType.REPORT,
      status: AgentStatus.ONLINE,
      totalProcessed: 2103,
      successRate: 93.4,
    },
  ] as const;

  const agents = await Promise.all(
    agentDefs.map((d) =>
      prisma.agent.create({
        data: {
          name: d.name,
          type: d.type,
          status: d.status,
          totalProcessed: d.totalProcessed,
          successRate: d.successRate,
          lastRunAt: faker.date.recent({ days: 3 }),
          config: {
            locale: 'pt-BR',
            timezone: 'America/Sao_Paulo',
            notifications: true,
          },
        },
      }),
    ),
  );

  const reportAgentIds = agents.filter((a) => a.type === AgentType.REPORT).map((a) => a.id);

  const categories = Object.values(EmailCategory);
  const priorities = Object.values(EmailPriority);
  const statuses = shuffle(STATUS_DISTRIBUTION);

  const emails = await Promise.all(
    Array.from({ length: 60 }, async (_, i) => {
      const status = statuses[i]!;
      const category = pick(categories);
      const priority = pick(priorities);
      const confidence =
        status === EmailStatus.PENDING
          ? faker.number.float({ min: 0.35, max: 0.55 })
          : status === EmailStatus.TRIAGED || status === EmailStatus.RESOLVED
            ? faker.number.float({ min: 0.82, max: 0.99 })
            : faker.number.float({ min: 0.55, max: 0.78 });

      const tpl = pick(SUBJECTS);
      const subject = formatSubject(tpl);
      const fromName = faker.person.fullName();
      const fromEmail = faker.internet.email({ provider: 'corplogistica.com.br' });

      return prisma.email.create({
        data: {
          userId: ownerId,
          from: `${fromName} <${fromEmail}>`,
          to: 'operacoes@logiagent-demo.com.br',
          subject,
          body: formatBody(),
          category,
          priority,
          confidence,
          status,
          processedAt:
            status !== EmailStatus.PENDING
              ? faker.date.recent({ days: 10 })
              : null,
          agentDecision:
            status === EmailStatus.PENDING
              ? undefined
              : {
                  summary: faker.lorem.sentence(),
                  categorySuggested: category,
                  confidenceModel: confidence,
                  flags: status === EmailStatus.ESCALATED ? ['sl_risk', 'vip_client'] : [],
                },
        },
      });
    }),
  );

  const escalatedEmails = emails.filter((e) => e.status === EmailStatus.ESCALATED);
  const ticketPriorities = ['critical', 'high', 'medium', 'low'] as const;
  const ticketStatuses: EscalationTicketStatus[] = [
    EscalationTicketStatus.NEW,
    EscalationTicketStatus.ANALYZING,
    EscalationTicketStatus.ESCALATED,
    EscalationTicketStatus.RESOLVED,
  ];

  for (let i = 0; i < 10; i++) {
    const email = escalatedEmails[i];
    if (!email) break;

    await prisma.escalationTicket.create({
      data: {
        userId: ownerId,
        subject: `Escalonamento: ${email.subject.slice(0, 80)}`,
        description: `Ticket aberto automaticamente a partir da triagem do e-mail ${email.id}.\n${faker.lorem.paragraph()}`,
        priority: ticketPriorities[i % ticketPriorities.length]!,
        status: pick(ticketStatuses),
        assignee: faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.7 }) ?? null,
        source: 'email-triage',
        emailId: email.id,
        aiDecisionLog: [
          {
            step: 'classify',
            confidence: email.confidence,
            at: new Date().toISOString(),
          },
          {
            step: 'route_escalation',
            reason: pick([
              'Prioridade alta com SLA próximo do estouro',
              'Cliente tier S com histórico de churn',
              'Suspeita de divergência fiscal na NF',
            ]),
          },
        ],
        timeline: [
          { type: 'created', at: faker.date.recent({ days: 2 }).toISOString() },
          { type: 'comment', text: faker.lorem.sentence(), by: 'sistema' },
        ],
      },
    });
  }

  const reportTypes = ['operacional', 'financeiro', 'sla', 'compliance', 'volume'];
  const reportTitles = [
    'Resumo semanal de processamento',
    'Indicadores de triagem por canal',
    'Análise de atrasos por região',
    'Performance de acurácia do modelo',
    'Tickets críticos e tempo médio de resposta',
  ];

  for (let r = 0; r < 20; r++) {
    const agentId = pick(reportAgentIds);
    const period = pick(['7d', '30d', 'Q1/2026', 'últimas 24h']);
    const summary = faker.lorem.paragraphs({ min: 2, max: 4 }, '\n\n');
    const insights = [
      'Volume de e-mails urgentes +12% vs. semana anterior, concentrado no turno da tarde.',
      'Taxa de confiança média da triagem manteve-se acima de 92% após ajuste de thresholds.',
      'Três rotas (Sul, Nordeste, Centro-Oeste) concentram 78% das ocorrências de SLA.',
      'Sugestão: reforçar regra de escalação para remetentes com domínio @fornecedores-criticos.com.',
      faker.lorem.sentence(),
    ];

    await prisma.report.create({
      data: {
        userId: ownerId,
        title: `${pick(reportTitles)} — ${faker.date.recent({ days: 5 }).toLocaleDateString('pt-BR')}`,
        type: pick(reportTypes),
        period,
        status: pick([
          ReportStatus.COMPLETED,
          ReportStatus.COMPLETED,
          ReportStatus.COMPLETED,
          ReportStatus.PENDING,
          ReportStatus.GENERATING,
        ]),
        agentId,
        parameters: {
          granularity: pick(['hour', 'day']),
          filters: { region: pick(['ALL', 'Sudeste', 'Sul']) },
        },
        content: {
          summary,
          insights: faker.helpers.arrayElements(insights, { min: 3, max: 5 }),
          kpis: {
            emailsProcessed: faker.number.int({ min: 400, max: 9000 }),
            avgLatencyMs: faker.number.int({ min: 800, max: 3400 }),
            escalationRate: faker.number.float({ min: 0.02, max: 0.18 }),
          },
          generatedAt: new Date().toISOString(),
        },
      },
    });
  }

  const logActions = [
    'triage.batch',
    'triage.single',
    'report.generate',
    'report.preview',
    'escalation.evaluate',
    'escalation.notify_webhook',
    'health.ping',
    'sync.embeddings_cache',
  ];

  for (let i = 0; i < 30; i++) {
    const agentId = agents[i % agents.length]!.id;
    const success = faker.number.float({ min: 0, max: 1 }) < 0.88;
    await prisma.agentLog.create({
      data: {
        agentId,
        action: pick(logActions),
        success,
        durationMs: faker.number.int({ min: 120, max: 8900 }),
        error: success ? null : faker.lorem.sentence(),
        input: { batchSize: faker.number.int({ min: 1, max: 40 }), locale: 'pt-BR' },
        output: success
          ? { itemsOk: faker.number.int({ min: 1, max: 50 }), version: '1.4.2' }
          : { code: 'TIMEOUT', retryable: true },
      },
    });
  }

  const settings = [
    {
      key: 'notifications:slack_webhook',
      category: 'integrations',
      value: { url: 'https://hooks.slack.com/services/demo/placeholder', enabled: false },
    },
    {
      key: 'triage:confidence_min',
      category: 'agents',
      value: { value: 0.78, autoEscalateBelow: true },
    },
    {
      key: 'reports:default_timezone',
      category: 'general',
      value: { timezone: 'America/Sao_Paulo', format: 'dd/MM/yyyy HH:mm' },
    },
    {
      key: 'escalation:business_hours',
      category: 'agents',
      value: { start: '08:00', end: '20:00', weekdays: [1, 2, 3, 4, 5] },
    },
    {
      key: 'audit:retention_days',
      category: 'compliance',
      value: { days: 365, coldStorageAfter: 180 },
    },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      create: { key: s.key, category: s.category, value: s.value as object },
      update: { category: s.category, value: s.value as object },
    });
  }

  console.log(
    JSON.stringify(
      {
        agents: agents.length,
        emails: emails.length,
        reports: 20,
        tickets: Math.min(10, escalatedEmails.length),
        logs: 30,
        settings: settings.length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
