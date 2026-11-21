import type { HttpClient } from '../core/http';
import { paginate, type PageEnvelope, type PagePromise } from '../core/pagination';
import type { PaginationParams } from '../types';
import type { ResourceRequestOptions } from './request-options';

/**
 * Status of a settlement batch as returned by the FacilPay API.
 */
export type SettlementStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

/**
 * A settlement batch paid out to a merchant.
 *
 * Monetary amounts are strings to preserve decimal precision.
 */
export interface Settlement {
  id: string;
  merchantId: string;
  /** Decimal amount in the settlement currency, as a string. */
  amount: string;
  /** ISO 4217 currency of the settlement. */
  currency: string;
  status: SettlementStatus;
  /** ISO-8601 timestamp when the batch was paid out. Present when status is `PAID`. */
  settledAt?: string | null;
  /** Optional external payout reference (e.g. a Stellar transaction hash). */
  reference?: string | null;
  /** Destination account the batch was paid out to. */
  destination?: string | null;
  /** Number of payments included in the batch. */
  payoutCount?: number;
  /** Fee deducted from the batch, as a decimal string. */
  fee?: string;
  /** Net amount paid out (amount minus fee), as a decimal string. */
  net?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parameters accepted when listing settlements.
 */
export interface ListSettlementsParams extends PaginationParams {
  /** Filter by settlement status. */
  status?: SettlementStatus;
  /** Start of the date range (inclusive), ISO-8601 date. */
  from?: string;
  /** End of the date range (inclusive), ISO-8601 date. */
  to?: string;
  /** Filter by settlement currency (ISO 4217). */
  currency?: string;
}

/**
 * Settlements resource.
 *
 * Merchants can list payout batches and reconcile them against their bank
 * or Stellar account, and retrieve a single batch by id.
 *
 * Exposed as `facilpay.settlements`.
 */
export class SettlementsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List settlement batches.
   *
   * Returns a page that is also an `AsyncIterable`: `await` it for the first
   * page, or use `for await` to iterate every settlement across all pages.
   *
   * `GET /v1/settlements`
   *
   * @param params - Optional pagination plus `status`, `from`/`to` date range
   *   and `currency` filters.
   * @returns A page of settlements that can be iterated across all pages.
   * @throws {FacilPayAPIError} When the API rejects the request.
   * @throws {FacilPayConnectionError} When the API cannot be reached.
   *
   * @example
   * ```ts
   * for await (const settlement of facilpay.settlements.list({
   *   status: 'PAID',
   *   from: '2026-01-01',
   *   to: '2026-01-31',
   *   currency: 'USDC',
   * })) {
   *   console.log(settlement.id, settlement.net);
   * }
   * ```
   */
  list(params?: ListSettlementsParams): PagePromise<Settlement> {
    return paginate<Settlement>((page) =>
      this.client.get<PageEnvelope<Settlement>>('/v1/settlements', {
        params: { ...params, page, limit: params?.limit ?? 20 },
      }),
    );
  }

  /**
   * Retrieve a settlement batch by id.
   *
   * `GET /v1/settlements/:id`
   *
   * @param id - Settlement id.
   * @param options - Per-request options (headers, signal, timeout, ...).
   * @returns The settlement batch.
   * @throws {FacilPayAPIError} When the settlement does not exist (`404`) or
   *   the request fails.
   * @throws {FacilPayConnectionError} When the API cannot be reached.
   *
   * @example
   * ```ts
   * const settlement = await facilpay.settlements.retrieve('stl_123');
   * ```
   */
  retrieve(id: string, options?: ResourceRequestOptions): Promise<Settlement> {
    return this.client.get<Settlement>(
      `/v1/settlements/${encodeURIComponent(id)}`,
      options,
    );
  }
}
