/**
 * Base error for all FacilPay SDK errors.
 */
export class FacilPayError extends Error {
  /** Machine-readable error code, when the throw site provides one. */
  public readonly code?: string;

  constructor(message: string, options?: { code?: string }) {
    super(message);
    this.name = 'FacilPayError';
    this.code = options?.code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when client-side validation rejects parameters before any request
 * is made (e.g. malformed idempotency keys or invalid resource arguments).
 */
export class FacilPayValidationError extends FacilPayError {
  /** Machine-readable failure code, when available. */
  public readonly code?: string;

  constructor(message: string, options?: { code?: string }) {
    super(message, options);
    this.name = 'FacilPayValidationError';
    this.code = options?.code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the SDK cannot reach the API (network failure, DNS error,
 * or a request that exceeded its configured timeout).
 */
export class FacilPayConnectionError extends FacilPayError {
  /** The underlying cause, when available (e.g. the original AbortError). */
  public readonly cause?: unknown;

  constructor(message = 'Failed to connect to the FacilPay API', cause?: unknown) {
    super(message);
    this.name = 'FacilPayConnectionError';
    this.cause = cause;
  }
}

/**
 * Thrown when a webhook signature is missing, malformed, or does not match
 * the expected HMAC digest for the provided secret(s).
 */
export class FacilPaySignatureVerificationError extends FacilPayError {
  constructor(message: string) {
    super(message);
    this.name = 'FacilPaySignatureVerificationError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the API responds with a non-2xx status code.
 */
export class FacilPayAPIError extends FacilPayError {
  public readonly status: number;
  public readonly requestId?: string;
  public readonly correlationId?: string;
  public readonly body?: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      requestId?: string;
      correlationId?: string;
      body?: unknown;
    },
  ) {
    super(message);
    this.name = 'FacilPayAPIError';
    this.status = options.status;
    this.requestId = options.requestId;
    this.correlationId = options.correlationId;
    this.body = options.body;
  }
}

/**
 * Thrown when a Soroban contract invocation fails, either because the
 * simulation rejected the call or because the contract returned a
 * non-zero error code. The original contract error code is preserved
 * on `code` so callers can branch on it programmatically.
 */
export class FacilPayContractError extends FacilPayError {
  /** Numeric contract error code returned by the Soroban contract. */
  public readonly contractCode?: number;

  constructor(
    message: string,
    options?: { code?: string; contractCode?: number },
  ) {
    super(message, { code: options?.code });
    this.name = 'FacilPayContractError';
    this.contractCode = options?.contractCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
