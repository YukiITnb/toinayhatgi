import { createClient } from 'redis';
import '@/server/env';
import { parseStoredOpenCount, isOpenCount } from '@/lib/open-count';

export const OPEN_COUNTER_KEY = 'toinayhatgi:opens';

export interface OpenCounterStore {
  get(key: string): Promise<string | null>;
  incr(key: string): Promise<number>;
}

type RedisClient = OpenCounterStore & {
  isOpen: boolean;
  isReady: boolean;
  connect(): Promise<unknown>;
  destroy(): void;
  on(event: 'error', listener: (error: Error) => void): unknown;
};

let client: RedisClient | undefined;
let connecting: Promise<RedisClient> | undefined;

function discardClient(candidate: RedisClient) {
  if (client !== candidate) return;
  client = undefined;
  if (candidate.isOpen) candidate.destroy();
}

async function redisClient(): Promise<RedisClient> {
  if (client?.isReady) return client;
  if (connecting) return connecting;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not configured');

  if (client) discardClient(client);
  const next = createClient({
    url,
    socket: {
      connectTimeout: 750,
      reconnectStrategy: false,
    },
  }) as RedisClient;
  next.on('error', () => {});
  client = next;
  const connection = next
    .connect()
    .then(() => next)
    .catch((error: unknown) => {
      discardClient(next);
      throw error;
    })
    .finally(() => {
      if (connecting === connection) connecting = undefined;
    });
  connecting = connection;
  return connection;
}

// Fallback in-memory store for deployments and environments without Redis
declare global {
  // eslint-disable-next-line no-var
  var __inMemoryOpenCounter: number | undefined;
}

const memoryStore: OpenCounterStore = {
  async get() {
    return String(globalThis.__inMemoryOpenCounter ?? 0);
  },
  async incr() {
    const current = (globalThis.__inMemoryOpenCounter ?? 0) + 1;
    globalThis.__inMemoryOpenCounter = current;
    return current;
  },
};

async function withStore<T>(
  operation: (store: OpenCounterStore) => Promise<T>,
) {
  if (!process.env.REDIS_URL) {
    return operation(memoryStore);
  }
  try {
    const current = await redisClient();
    return await operation(current);
  } catch {
    if (client) discardClient(client);
    return operation(memoryStore);
  }
}

export async function readOpenCountFrom(store: OpenCounterStore) {
  const count = parseStoredOpenCount(await store.get(OPEN_COUNTER_KEY));
  if (count === null) throw new Error('Invalid Redis open counter');
  return count;
}

export async function incrementOpenCountFrom(store: OpenCounterStore) {
  const count = await store.incr(OPEN_COUNTER_KEY);
  if (!isOpenCount(count)) throw new Error('Invalid Redis open counter');
  return count;
}

export function readOpenCount() {
  return withStore(readOpenCountFrom);
}

export function incrementOpenCount() {
  return withStore(incrementOpenCountFrom);
}
