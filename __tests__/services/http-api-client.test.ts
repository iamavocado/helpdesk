import { HttpApiClient, classificationFromStatus } from '@/services/api';

type Json = Record<string, unknown>;

function mockFetchOnce(payload: Json, ok = true, status = 200): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  });
}

const wrap = (datos: unknown): Json => ({
  exitoso: true,
  mensaje: null,
  datos,
  errores: null,
  codigoEstado: 200,
});

beforeEach(() => {
  global.fetch = jest.fn();
});

function client() {
  return new HttpApiClient({
    baseUrl: 'https://api.test/HelpDesk.Api',
    getToken: async () => 'tok',
    refresh: async () => null,
  });
}

describe('classificationFromStatus', () => {
  it('mapea estados a las 3 clasificaciones', () => {
    expect(classificationFromStatus(1)).toBe(1); // Pendiente
    expect(classificationFromStatus(2)).toBe(2); // Cola
    expect(classificationFromStatus(3)).toBe(3); // Cerrado (Resuelto)
    expect(classificationFromStatus(4)).toBe(3); // Cerrado
    expect(classificationFromStatus(5)).toBe(1); // espera AIG → Pendiente
    expect(classificationFromStatus(6)).toBe(1); // espera cliente → Pendiente
    expect(classificationFromStatus(null)).toBe(1);
  });
});

describe('HttpApiClient (adaptador API real)', () => {
  it('login desempaqueta el token y arma la sesión (sin refresh)', async () => {
    mockFetchOnce(wrap({ token: 'h.eyJ.sig', expiracion: '2026-06-06T00:00:00Z' }));
    const tokens = await client().login({ username: 'admin', password: 'x' });
    expect(tokens.accessToken).toBe('h.eyJ.sig');
    expect(tokens.refreshToken).toBe('');
    expect(tokens.user.username).toBe('admin');
  });

  it('getCases mapea la lista liviana y deriva la clasificación del estado', async () => {
    mockFetchOnce(
      wrap({
        items: [
          {
            id: 2030,
            userRequester: 'Emilce',
            statusCaseId: 3,
            statusCaseDesc: 'Resuelto',
            priorityId: 2,
            priorityDesc: 'Media',
            serviceTypeDesc: 'Preventivo',
            caseDetails: 'Prueba',
            client: 'SPA',
            creationDate: '2022-10-21T15:42:26.183',
          },
        ],
        numeroPagina: 1,
        tamanoPagina: 20,
        totalRegistros: 951,
        totalPaginas: 48,
      }),
    );
    const page = await client().getCases({ page: 1, pageSize: 20 });
    expect(page.total).toBe(951);
    expect(page.items[0]?.Id).toBe(2030);
    expect(page.items[0]?.ClassificationCaseId).toBe(3); // status 3 → Cerrado
    expect(page.items[0]?.Client).toBe('SPA');
  });

  it('getCase usa el classificationCaseId real del detalle', async () => {
    mockFetchOnce(
      wrap({
        id: 2030,
        statusCaseId: 3,
        classificationCaseId: 3,
        equipmentTypeId: 2,
        equipmentTypeDesc: 'Software',
        softwareModuleDesc: 'Registro de actuaciones',
        caseDetails: 'Prueba',
        creationDate: '2022-10-21T15:42:26.183',
      }),
    );
    const c = await client().getCase(2030);
    expect(c.ClassificationCaseId).toBe(3);
    expect(c.EquipmentTypeDesc).toBe('Software');
  });

  it('getComments usa el endpoint por-case y ordena por fecha ascendente', async () => {
    // El endpoint por-case devuelve un arreglo con solo los comentarios del caso.
    mockFetchOnce(
      wrap([
        {
          id: 1,
          idCase: 28,
          comment: 'nuevo',
          isPrivate: false,
          creationDate: '2022-01-01T11:00:00',
        },
        {
          id: 0,
          idCase: 28,
          comment: 'viejo',
          isPrivate: false,
          creationDate: '2022-01-01T10:00:00',
        },
      ]),
    );
    const comments = await client().getComments(28);
    expect(comments).toHaveLength(2);
    expect(comments[0]?.Comment).toBe('viejo'); // ordenado por fecha ascendente
    expect(comments[1]?.Comment).toBe('nuevo');
    expect(comments[0]?.IdCase).toBe(28);
  });
});
