import { ApiError, MockApiClient } from '@/services/api';

describe('MockApiClient', () => {
  it('siembra ≥50 casos en las 3 clasificaciones', async () => {
    const api = new MockApiClient();
    const all = await api.getCases({ pageSize: 1000 });
    expect(all.total).toBeGreaterThanOrEqual(50);

    const pend = await api.getCases({ classificationId: 1, pageSize: 1000 });
    const cola = await api.getCases({ classificationId: 2, pageSize: 1000 });
    const cerr = await api.getCases({ classificationId: 3, pageSize: 1000 });
    expect(pend.total).toBeGreaterThan(0);
    expect(cola.total).toBeGreaterThan(0);
    expect(cerr.total).toBeGreaterThan(0);
    expect(pend.total + cola.total + cerr.total).toBe(all.total);
  });

  it('pagina los casos', async () => {
    const api = new MockApiClient();
    const page1 = await api.getCases({ page: 1, pageSize: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.page).toBe(1);
  });

  it('createCase asigna un Id de servidor incremental y estado Pendiente', async () => {
    const api = new MockApiClient();
    const before = (await api.getCases({ pageSize: 1000 })).total;
    const created = await api.createCase({
      EquipmentTypeId: 2,
      EquipmentTypeDesc: 'Software',
      CaseDetails: 'Nuevo caso de prueba',
    });
    expect(created.Id).toBe(before + 1);
    expect(created.ClassificationCaseId).toBe(1);
  });

  it('addComment numera por caso y getCase lanza 404 si no existe', async () => {
    const api = new MockApiClient();
    const comment = await api.addComment({ IdCase: 1, Comment: 'Hola', IsPrivate: false });
    expect(comment.Id).toBeGreaterThan(0);
    expect(comment.IdCase).toBe(1);

    await expect(api.getCase(999999)).rejects.toBeInstanceOf(ApiError);
  });
});
