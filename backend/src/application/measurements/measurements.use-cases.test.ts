import { describe, expect, it, vi } from 'vitest';
import type { AuditLogRepository, ClientRepository, MeasurementRepository, TenantRepository } from '../../domain/repositories';
import type { Client, ClientMeasurement, Tenant } from '../../domain/shared/entities';
import { Status } from '../../domain/shared/enums';
import { CreateClientMeasurementUseCase } from './create-client-measurement.use-case';
import { DeleteClientMeasurementUseCase } from './delete-client-measurement.use-case';
import { ListClientMeasurementsUseCase } from './list-client-measurements.use-case';
import { hasMeasurementValues, normalizeMeasurement } from './measurement-rules';
import { UpdateClientMeasurementUseCase } from './update-client-measurement.use-case';

const NOW = new Date('2026-11-17T10:00:00.000Z');
const clock = { now: () => NOW };

const tenant = { id: 'tenant-1', measurementsEnabled: true } as Tenant;
const client = { id: 'client-1', tenantId: 'tenant-1', status: Status.ACTIVE } as Client;
const measurement: ClientMeasurement = {
  id: 'm-1',
  tenantId: 'tenant-1',
  clientId: 'client-1',
  measuredAt: new Date('2026-11-03T12:00:00.000Z'),
  weight: 80.2,
  bodyFatPercentage: 18.4,
  muscleMass: 34.1,
  notes: null,
  createdById: 'user-1',
  createdAt: NOW,
  updatedAt: NOW,
};

function setup({ enabled = true, existingClient = client as Client | null, existing = measurement as ClientMeasurement | null } = {}) {
  const measurements: MeasurementRepository = {
    listByClient: vi.fn(async () => [measurement]),
    findById: vi.fn(async () => existing),
    create: vi.fn(async (data) => ({ ...measurement, ...data, id: 'm-new' })),
    update: vi.fn(async (_id, data) => ({ ...measurement, ...data })),
    delete: vi.fn(async () => undefined),
    deleteByClient: vi.fn(async () => undefined),
  };
  const clients = { findById: vi.fn(async () => existingClient) } as unknown as ClientRepository;
  const tenants = { findActiveById: vi.fn(async () => ({ ...tenant, measurementsEnabled: enabled })) } as unknown as TenantRepository;
  const auditLogs: AuditLogRepository = { create: vi.fn(async () => undefined) };
  return { measurements, clients, tenants, auditLogs };
}

describe('measurement rules', () => {
  it('normalizes values, decimals with comma and day-only dates', () => {
    expect(normalizeMeasurement({ measuredAt: '2026-11-17', weight: '78,46', muscleMass: 34, notes: '  báscula del box  ' }, NOW)).toEqual({
      measuredAt: new Date('2026-11-17T12:00:00.000Z'),
      weight: 78.5,
      bodyFatPercentage: null,
      muscleMass: 34,
      notes: 'báscula del box',
    });
  });

  it('requires a date, at least one metric and sensible ranges', () => {
    expect(() => normalizeMeasurement({ weight: 80 }, NOW)).toThrow('La fecha de la medición es obligatoria');
    expect(() => normalizeMeasurement({ measuredAt: '2026-11-17' }, NOW)).toThrow('Indica al menos');
    expect(() => normalizeMeasurement({ measuredAt: '2026-11-17', weight: 800 }, NOW)).toThrow('El peso debe estar entre 20 y 400');
    expect(() => normalizeMeasurement({ measuredAt: '2026-11-17', bodyFatPercentage: 90 }, NOW)).toThrow('La grasa corporal');
    expect(() => normalizeMeasurement({ measuredAt: '2026-11-18', weight: 80 }, NOW)).toThrow('no puede ser futura');
    expect(() => normalizeMeasurement({ measuredAt: 'ayer', weight: 80 }, NOW)).toThrow('no es válida');
    expect(() => normalizeMeasurement({ measuredAt: '2026-11-17', weight: 80, notes: 'x'.repeat(1001) }, NOW)).toThrow('Las notas');
  });

  it('detects whether an optional first measurement carries values', () => {
    expect(hasMeasurementValues(undefined)).toBe(false);
    expect(hasMeasurementValues({ measuredAt: '2026-11-17', weight: '' })).toBe(false);
    expect(hasMeasurementValues({ measuredAt: '2026-11-17', muscleMass: 30 })).toBe(true);
  });
});

describe('measurement use cases', () => {
  it('lists, creates, updates and deletes with an audit trail', async () => {
    const repos = setup();
    const list = new ListClientMeasurementsUseCase(repos.measurements, repos.clients, repos.tenants);
    const create = new CreateClientMeasurementUseCase(repos.measurements, repos.clients, repos.tenants, repos.auditLogs, clock);
    const update = new UpdateClientMeasurementUseCase(repos.measurements, repos.clients, repos.tenants, repos.auditLogs, clock);
    const remove = new DeleteClientMeasurementUseCase(repos.measurements, repos.clients, repos.tenants, repos.auditLogs);

    expect(await list.execute('tenant-1', 'client-1')).toEqual([measurement]);

    const created = await create.execute('tenant-1', 'client-1', { measuredAt: '2026-11-17', weight: 79.6 }, 'trainer-1');
    expect(repos.measurements.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1', clientId: 'client-1', createdById: 'trainer-1', weight: 79.6 }));
    expect(created.id).toBe('m-new');

    await update.execute('tenant-1', 'client-1', 'm-1', { measuredAt: '2026-11-03', weight: 80 }, 'trainer-1');
    expect(repos.measurements.update).toHaveBeenCalledWith('m-1', expect.objectContaining({ weight: 80 }));

    await remove.execute('tenant-1', 'client-1', 'm-1', 'trainer-1');
    expect(repos.measurements.delete).toHaveBeenCalledWith('m-1');
    expect(vi.mocked(repos.auditLogs.create).mock.calls.map(([log]) => log.action)).toEqual(['CREATE', 'UPDATE', 'DELETE']);
  });

  it('is forbidden when the center disabled measurement tracking', async () => {
    const repos = setup({ enabled: false });
    await expect(new ListClientMeasurementsUseCase(repos.measurements, repos.clients, repos.tenants).execute('tenant-1', 'client-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('rejects unknown clients and measurements from another client', async () => {
    const noClient = setup({ existingClient: null });
    await expect(new ListClientMeasurementsUseCase(noClient.measurements, noClient.clients, noClient.tenants).execute('tenant-1', 'nope')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    const foreign = setup({ existing: { ...measurement, clientId: 'client-2' } });
    const update = new UpdateClientMeasurementUseCase(foreign.measurements, foreign.clients, foreign.tenants, foreign.auditLogs, clock);
    await expect(update.execute('tenant-1', 'client-1', 'm-1', { measuredAt: '2026-11-03', weight: 80 }, 'u')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const remove = new DeleteClientMeasurementUseCase(foreign.measurements, foreign.clients, foreign.tenants, foreign.auditLogs);
    await expect(remove.execute('tenant-1', 'client-1', 'm-1', 'u')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(foreign.measurements.delete).not.toHaveBeenCalled();
  });
});
