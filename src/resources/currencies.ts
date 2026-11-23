import type { HttpClient } from '../core/http';
import type { ResourceRequestOptions } from './request-options';

/** A currency or payment asset supported by FacilPay. */
export interface Currency {
  /** Currency or asset code, such as `USD` or `USDC`. */
  code: string;
  /** Issuer account for issued assets; `null` for assets without an issuer. */
  issuer: string | null;
  /** Number of fractional digits used by the currency or asset. */
  decimals: number;
  /** Network the asset is available on, such as `stellar`. */
  network: string;
  /** Whether the currency or asset is currently enabled. */
  enabled: boolean;
}

/**
 * List currencies and assets supported by FacilPay.
 *
 * Exposed as `facilpay.currencies`.
 */
export class CurrenciesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List supported currencies and assets.
   *
   * `GET /v1/currencies`
   */
  list(options?: ResourceRequestOptions): Promise<Currency[]> {
    return this.http.get<Currency[]>('/v1/currencies', options);
  }
}
