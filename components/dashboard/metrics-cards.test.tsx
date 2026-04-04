import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsCards } from './metrics-cards';

vi.mock('@/hooks/use-dashboard-kpis', () => ({
  useDashboardKpis: () => ({
    data: {
      emailsProcessed: 42,
      emailsProcessedToday: 2,
      emailsProcessedWeek: 12,
      emailsProcessedMonth: 30,
      triageAccuracyPercent: 91.5,
      reportsGenerated: 5,
      ticketsEscalated: 1,
      agentsOnline: 3,
      emailsPending: 4,
      avgProcessingTimeMs: 2300,
      period: '7d',
      startDate: null,
      endDate: null,
    },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
  }),
}));

describe('MetricsCards', () => {
  it('renders KPI labels and formatted values', () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MetricsCards
          period="7d"
          onPeriodChange={() => undefined}
          customRange={null}
          onCustomRangeChange={() => undefined}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText('E-mails Processados')).toBeTruthy();
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('91.5%')).toBeTruthy();
    expect(screen.getByText('Relatórios Gerados')).toBeTruthy();
    expect(screen.getByText('Tickets Escalonados')).toBeTruthy();
    expect(screen.getByText('2.3s')).toBeTruthy();
  });
});
