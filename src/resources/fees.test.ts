import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeesResource } from './fees';

function createMockHttp() {
  return { get: vi.fn(), post: vi.fn() };
}

describe('FeesResource', () => {
  let http: ReturnType<typeof createMockHttp>;
  let fees: FeesResource;

  beforeEach(() => {
    http = createMockHttp();
    fees = new FeesResource(http as unknown as ConstructorParameters<typeof FeesResource>[0]);
  });

  it('retrieves the current merchant fee configuration', async () => {
    const config = {
      id: 'fee_123',
      merchantId: 'merchant_123',
      flatFee: '1.25',
      percentageFee: '2.50',
      minFee: '0.50',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    http.get.mockResolvedValue(config);

    await expect(fees.retrieve()).resolves.toEqual(config);
    expect(http.get).toHaveBeenCalledWith('/v1/merchants/me/fees', undefined);
  });

  it('calculates fees with the amount preserved as a decimal string', async () => {
    const params = { amount: '123456789012345.67', currency: 'USD' };
    const preview = { gross: params.amount, fee: '3086419725308.64', net: '120370369287037.03' };
    http.post.mockResolvedValue(preview);

    await expect(fees.calculate(params)).resolves.toEqual(preview);
    expect(http.post).toHaveBeenCalledWith('/v1/merchants/me/fees/calculate', params, undefined);
  });

  it('forwards per-request options', async () => {
    const options = { headers: { 'X-Request-Id': 'request_123' }, timeout: 5000 };
    http.post.mockResolvedValue({ gross: '10.00', fee: '0.25', net: '9.75' });

    await fees.calculate({ amount: '10.00', currency: 'USD' }, options);

    expect(http.post).toHaveBeenCalledWith(
      '/v1/merchants/me/fees/calculate',
      { amount: '10.00', currency: 'USD' },
      options,
    );
  });
});
