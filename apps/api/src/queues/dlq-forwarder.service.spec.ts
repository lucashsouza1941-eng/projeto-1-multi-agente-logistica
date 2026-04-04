import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertService } from '../modules/alerts/alert.service';
import type { Queue } from 'bullmq';
import { DlqForwarderService } from './dlq-forwarder.service';

const queueEventsInstances: {
  on: ReturnType<typeof vi.fn>;
  waitUntilReady: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}[] = [];

vi.mock('bullmq', async (importOriginal) => {
  const mod = await importOriginal<typeof import('bullmq')>();
  return {
    ...mod,
    QueueEvents: vi.fn().mockImplementation(() => {
      const inst = {
        waitUntilReady: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
      };
      queueEventsInstances.push(inst);
      return inst;
    }),
    Queue: vi.fn().mockImplementation(() => ({
      close: vi.fn().mockResolvedValue(undefined),
    })),
    Job: {
      fromId: vi.fn(),
    },
  };
});

describe('DlqForwarderService', () => {
  let dlqAdd: ReturnType<typeof vi.fn>;
  let alertsSend: ReturnType<typeof vi.fn>;
  let service: DlqForwarderService;

  beforeEach(() => {
    queueEventsInstances.length = 0;
    vi.mocked(Job.fromId).mockReset();
    dlqAdd = vi.fn().mockResolvedValue(undefined);
    alertsSend = vi.fn().mockResolvedValue(undefined);
    const config = {
      get: vi.fn().mockReturnValue('redis://127.0.0.1:6379'),
    } as unknown as ConfigService;
    const alerts = { send: alertsSend } as unknown as AlertService;
    const dlq = { add: dlqAdd } as unknown as Queue;
    service = new DlqForwarderService(config, alerts, dlq);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function getEmailTriageFailedHandler() {
    await service.onModuleInit();
    const first = queueEventsInstances[0];
    expect(first).toBeDefined();
    const failedCall = first.on.mock.calls.find((c) => c[0] === 'failed');
    expect(failedCall).toBeDefined();
    return failedCall![1] as (a: { jobId: string }) => Promise<void>;
  }

  it('após 3 tentativas falhadas encaminha job para a DLQ e alerta', async () => {
    vi.mocked(Job.fromId).mockResolvedValue({
      id: 'j1',
      name: 'process-email',
      data: { emailId: 'e1' },
      opts: { attempts: 3 },
      attemptsMade: 3,
      stacktrace: [],
      failedReason: 'boom',
    } as never);

    const handler = await getEmailTriageFailedHandler();
    await handler({ jobId: 'j1' });

    expect(dlqAdd).toHaveBeenCalledWith(
      'dlq-from-email-triage',
      expect.objectContaining({
        sourceQueue: 'email-triage',
        originalJobId: 'j1',
      }),
      expect.any(Object),
    );
    expect(alertsSend).toHaveBeenCalledWith(
      'critical',
      expect.stringContaining('email-triage'),
      expect.any(Object),
    );
  });

  it('payload inválido (UnrecoverableError) encaminha para DLQ sem esperar 3 tentativas', async () => {
    vi.mocked(Job.fromId).mockResolvedValue({
      id: 'j2',
      name: 'process-email',
      data: {},
      opts: { attempts: 3 },
      attemptsMade: 1,
      stacktrace: ['UnrecoverableError: emailId obrigatório'],
      failedReason: 'emailId obrigatório',
    } as never);

    const handler = await getEmailTriageFailedHandler();
    await handler({ jobId: 'j2' });

    expect(dlqAdd).toHaveBeenCalled();
  });

  it('ainda há retries pendentes → não envia à DLQ', async () => {
    vi.mocked(Job.fromId).mockResolvedValue({
      id: 'j3',
      name: 'process-email',
      data: { emailId: 'e1' },
      opts: { attempts: 3 },
      attemptsMade: 1,
      stacktrace: ['transient'],
      failedReason: 'retry',
    } as never);

    const handler = await getEmailTriageFailedHandler();
    await handler({ jobId: 'j3' });

    expect(dlqAdd).not.toHaveBeenCalled();
  });
});
