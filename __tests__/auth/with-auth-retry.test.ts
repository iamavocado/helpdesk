import { ApiError, withAuthRetry } from '@/services/api';

describe('withAuthRetry (interceptor 401 → refresh → reintento)', () => {
  it('adjunta el token y no refresca si la petición tiene éxito', async () => {
    const refresh = jest.fn(async () => 'nuevo');
    const execute = jest.fn(async (token: string | null) => `ok:${token}`);

    const result = await withAuthRetry(execute, { getToken: async () => 'tok', refresh });

    expect(result).toBe('ok:tok');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('ante 401 refresca una vez y reintenta con el nuevo token', async () => {
    const refresh = jest.fn(async () => 'tok2');
    let calls = 0;
    const execute = jest.fn(async (token: string | null) => {
      calls++;
      if (calls === 1) throw new ApiError(401, 'expirado');
      return `ok:${token}`;
    });

    const result = await withAuthRetry(execute, { getToken: async () => 'tok1', refresh });

    expect(result).toBe('ok:tok2');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('si el refresh falla (null), propaga 401', async () => {
    const refresh = jest.fn(async () => null);
    const execute = jest.fn(async () => {
      throw new ApiError(401, 'expirado');
    });

    await expect(withAuthRetry(execute, { getToken: async () => 'tok', refresh })).rejects.toEqual(
      expect.objectContaining({ status: 401 }),
    );
  });

  it('no refresca ante errores que no sean 401', async () => {
    const refresh = jest.fn(async () => 'x');
    const execute = jest.fn(async () => {
      throw new ApiError(500, 'server');
    });

    await expect(withAuthRetry(execute, { getToken: async () => 'tok', refresh })).rejects.toEqual(
      expect.objectContaining({ status: 500 }),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
