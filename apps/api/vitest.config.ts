import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/agents/triage-agent.service.ts',
        'src/agents/report-agent.service.ts',
        'src/modules/auth/auth.service.ts',
        'src/modules/email/email.service.ts',
        'src/modules/dashboard/dashboard.service.ts',
        'src/modules/escalation/escalation.service.ts',
        'src/modules/escalation/rules-engine.service.ts',
        'src/email-triage/email-triage.processor.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
      },
    },
  },
});
