import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { HttpClient } from '../core/http';
import {
  SettlementsResource,
  type ListSettlementsParams,
  type Settlement,
} from './settlements';

const BASE = 'https://api.test';

const ALL: Settlement[] = [
  {
    id: 'stl_1',
    merchantId: 'mch_1',
    amount: '100.00',
    currency: 'USDC',
    status: 'PAID',
    settledAt: '2026-01-15T10:00:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'stl_2',
    merchantId: 'mch_1',
    amount: '250.00',
    currency: 'USDC',
    status: 'PAID',
    settledAt: '2026-01-16T10:00:00Z',
    createdAt: '2026-01-16T09:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
  },
  {
    id: 'stl_3',
    merchantId: 'mch_1',
    amount: '50.00',
    currency: 'USD',
    status: 'PENDING',
    createdAt: '2026-01-17T09:00:00Z',
    updatedAt: '2026-01-17T09:00:00Z',
  },
];

let lastListUrl: string | null = null;

const server = setupServer(
  http.get(`${BASE}/v1/settlements`, ({ request }) => {
    const url = new URL(request.url);
    lastListUrl = url.toString();
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '2');
    const status = url.searchParams.get('status');
    const currency = url.searchParams.get('currency');
    let filtered = ALL;
    if (status) filtered = filtered.filter((s) => s.status === status);
    if (currency) filtered = filtered.filter((s) => s.currency === currency);
    const start = (page - 1) * limit;
    return HttpResponse.json({
      data: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
    });
  }),
  http.get(`${BASE}/v1/settlements/:id`, ({ params }) => {
    const id = String(params.id);
    const found = ALL.find((s) => s.id === id);
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(found);
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createResource() {
  const httpClient = new HttpClient({ baseUrl: BASE });
  return new SettlementsResource(httpClient);
}

describe('SettlementsResource', () => {
  it('list GETs /v1/settlements and resolves to the first page', async () => {
    const settlements = createResource();
    const page = await settlements.list();

    expect(page.data.map((s) => s.id)).toEqual(['stl_1', 'stl_2']);
    expect(page.total).toBe(3);
    expect(page.page).toBe(1);
    expect(page.hasMore).toBe(true);
    expect(page.limit).toBe(2);
  });

  it('list works without params', async () => {
    const settlements = createResource();
    const page = await settlements.list();

    expect(page.data).toHaveLength(2);
    expect(lastListUrl).toContain('/v1/settlements');
    expect(new URL(lastListUrl!).searchParams.get('page')).toBe('1');
  });

  it('forwards status, currency and date-range filters as query params', async () => {
    const settlements = createResource();
    lastListUrl = null;

    const params: ListSettlementsParams = {
      status: 'PAID',
      from: '2026-01-01',
      to: '2026-01-31',
      currency: 'USDC',
      page: 2,
      limit: 5,
    };
    await settlements.list(params);

    const url = new URL(lastListUrl!);
    expect(url.pathname).toBe('/v1/settlements');
    expect(url.searchParams.get('status')).toBe('PAID');
    expect(url.searchParams.get('from')).toBe('2026-01-01');
    expect(url.searchParams.get('to')).toBe('2026-01-31');
    expect(url.searchParams.get('currency')).toBe('USDC');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('5');
  });

  it('filters by status server-side', async () => {
    const settlements = createResource();
    const page = await settlements.list({ status: 'PENDING' });

    expect(page.data.map((s) => s.id)).toEqual(['stl_3']);
    expect(page.total).toBe(1);
  });

  it('iterates every settlement across all pages with for await', async () => {
    const settlements = createResource();
    const seen: string[] = [];
    for await (const settlement of settlements.list()) {
      seen.push(settlement.id);
    }
    expect(seen).toEqual(['stl_1', 'stl_2', 'stl_3']);
  });

  it('toArray collects across pages up to the required limit cap', async () => {
    const settlements = createResource();
    const items = await settlements.list().toArray({ limit: 2 });

    expect(items.map((s) => s.id)).toEqual(['stl_1', 'stl_2']);
  });

  it('retrieve GETs /v1/settlements/:id', async () => {
    const settlements = createResource();
    const settlement = await settlements.retrieve('stl_1');

    expect(settlement.id).toBe('stl_1');
    expect(settlement.status).toBe('PAID');
    expect(settlement.net).toBeUndefined();
  });

  it('retrieve throws a FacilPayAPIError with status 404 for a missing settlement', async () => {
    const settlements = createResource();

    await expect(settlements.retrieve('stl_missing')).rejects.toMatchObject({
      status: 404,
    });
  });
});
