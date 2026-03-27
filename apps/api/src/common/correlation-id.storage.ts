import { AsyncLocalStorage } from 'node:async_hooks';

type CorrelationStore = { correlationId: string };

const correlationIdStorage = new AsyncLocalStorage<CorrelationStore>();

export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore()?.correlationId;
}

export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationIdStorage.run({ correlationId }, fn);
}

export { correlationIdStorage };
