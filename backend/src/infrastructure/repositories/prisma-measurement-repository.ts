import type { MeasurementRepository, MeasurementValues } from '../../domain/repositories';
import type { ClientMeasurement } from '../../domain/shared/entities';
import prisma from '../prisma/prisma-client';

export class PrismaMeasurementRepository implements MeasurementRepository {
  listByClient(tenantId: string, clientId: string): Promise<ClientMeasurement[]> {
    return prisma.clientMeasurement.findMany({
      where: { tenantId, clientId },
      orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(tenantId: string, id: string): Promise<ClientMeasurement | null> {
    return prisma.clientMeasurement.findFirst({ where: { id, tenantId } });
  }

  create(data: MeasurementValues & { tenantId: string; clientId: string; createdById: string }): Promise<ClientMeasurement> {
    return prisma.clientMeasurement.create({ data });
  }

  update(id: string, data: MeasurementValues): Promise<ClientMeasurement> {
    return prisma.clientMeasurement.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.clientMeasurement.delete({ where: { id } });
  }

  async deleteByClient(tenantId: string, clientId: string): Promise<void> {
    await prisma.clientMeasurement.deleteMany({ where: { tenantId, clientId } });
  }
}
