import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrenciesResource } from './currencies';

function createMockHttp() {
  return { get: vi.fn() };
}

describe('CurrenciesResource', () => {
  let http: ReturnType<typeof createMockHttp>;
  let currencies: CurrenciesResource;

  beforeEach(() => {
    http = createMockHttp();
    currencies = new CurrenciesResource(
      http as unknown as ConstructorParameters<typeof CurrenciesResource>[0],
    );
  });

  it('lists supported currencies and assets', async () => {
    const supported = [
      {
        code: 'USDC',
        issuer: 'GABC',
        decimals: 7,
        network: 'stellar',
        enabled: true,
      },
    ];
    http.get.mockResolvedValue(supported);

    await expect(currencies.list()).resolves.toEqual(supported);
    expect(http.get).toHaveBeenCalledWith('/v1/currencies', undefined);
  });

  it('forwards per-request options', async () => {
    const options = { headers: { 'X-Request-Id': 'request_123' }, timeout: 5000 };
    http.get.mockResolvedValue([]);

    await currencies.list(options);

    expect(http.get).toHaveBeenCalledWith('/v1/currencies', options);
  });
});
