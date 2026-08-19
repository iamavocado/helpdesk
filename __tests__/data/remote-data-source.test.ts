import { ApiRemoteDataSource, toDomainError } from '@/data';
import { ApiError, MockApiClient } from '@/services/api';

describe('toDomainError', () => {
  it('traduce ApiError según el status', () => {
    expect(toDomainError(new ApiError(0, 'x')).kind).toBe('network');
    expect(toDomainError(new ApiError(401, 'x')).kind).toBe('auth');
    expect(toDomainError(new ApiError(403, 'x')).kind).toBe('auth');
    expect(toDomainError(new ApiError(404, 'x')).kind).toBe('not_found');
    // 5xx = transitorio del servidor → 'server' (reintentable por el SyncEngine).
    expect(toDomainError(new ApiError(500, 'x')).kind).toBe('server');
    expect(toDomainError(new ApiError(503, 'x')).kind).toBe('server');
  });

  it('traduce errores desconocidos', () => {
    expect(toDomainError(new Error('boom')).kind).toBe('unknown');
  });
});

describe('ApiRemoteDataSource', () => {
  it('fetchCases mapea DTOs a entidades de dominio', async () => {
    const remote = new ApiRemoteDataSource(new MockApiClient());
    const page = await remote.fetchCases({ page: 1, pageSize: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.items[0]?.serverId).not.toBeNull();
    expect(['pendiente', 'cola', 'cerrado']).toContain(page.items[0]?.classification);
  });

  it('createComment mapea el comentario creado al dominio', async () => {
    const remote = new ApiRemoteDataSource(new MockApiClient());
    const comment = await remote.createComment(
      { caseId: 'local-x', body: 'Hola', isPrivate: true },
      1,
    );
    expect(comment.caseId).toBe('local-x');
    expect(comment.isPrivate).toBe(true);
    expect(comment.serverId).not.toBeNull();
  });

  it('lanza DomainError de tipo not_found cuando el caso no existe', async () => {
    const remote = new ApiRemoteDataSource(new MockApiClient());
    await expect(remote.fetchCase(999999)).rejects.toMatchObject({ kind: 'not_found' });
  });
});
