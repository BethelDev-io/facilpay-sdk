import type { HttpClient } from '../core/http';
import type { ResourceRequestOptions } from './request-options';

/**
 * The current fee configuration for the authenticated merchant.
 *
 * Monetary values are strings to preserve decimal precision.
 */
export interface FeeConfiguration {
  id: string;
  merchantId: string;
  flatFee: string;
  percentageFee: string;
  minFee: string;
  createdAt: string;
  updatedAt: string;
}

/** Parameters for previewing a fee on an amount. */
export interface CalculateFeesParams {
  /** Decimal amount in the currency's major unit, represented as a string. */
  amount: string;
  /** ISO 4217 currency code. */
  currency: string;
}

/** Fee preview amounts, represented as strings to preserve decimal precision. */
export interface FeeCalculation {
  gross: string;
  fee: string;
  net: string;
}

/**
 * Read the authenticated merchant's fee configuration and preview fees.
 *
 * Exposed as `facilpay.fees`.
 */
export class FeesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieve the current merchant fee configuration.
   *
   * `GET /v1/merchants/me/fees`
   */
  retrieve(options?: ResourceRequestOptions): Promise<FeeConfiguration> {
    return this.http.get<FeeConfiguration>('/v1/merchants/me/fees', options);
  }

  /**
   * Preview the gross amount, fee and net amount for a payment.
   *
   * `POST /v1/merchants/me/fees/calculate`
   *
   * @param params - Amount as a decimal string and the ISO 4217 currency.
   * @param options - Per-request options (headers, signal, timeout, ...).
   */
  calculate(
    params: CalculateFeesParams,
    options?: ResourceRequestOptions,
  ): Promise<FeeCalculation> {
    return this.http.post<FeeCalculation>('/v1/merchants/me/fees/calculate', params, options);
  }
}
