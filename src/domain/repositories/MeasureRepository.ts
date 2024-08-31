import { PrismaClient } from '@prisma/client';
import { Measure } from '../entities/measure';
import { IMeasureRepository } from './contract/IMeasureRepository';
import { PrismaMeasureMapper } from './mappers/MeasureMapper';

export class MeasureRepository implements IMeasureRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: Measure): Promise<void> {
    const prismaMeasure = PrismaMeasureMapper.toPrisma(data);
    await this.prisma.measure.create({
      data: {
        ...prismaMeasure,
        id: data.id.toString(),
      },
    });
  }

  async findById(id: string): Promise<Measure | null> {
    const measure = await this.prisma.measure.findUnique({
      where: { id },
    });

    if (!measure) return null;

    return PrismaMeasureMapper.toDomain(measure);
  }

  async findByMeasureId(measure_uuid: string): Promise<Measure | null> {
    const measure = await this.prisma.measure.findUnique({
      where: { measure_uuid },
    });

    if (!measure) return null;

    return PrismaMeasureMapper.toDomain(measure);
  }
  
  async update(measure_uuid: string, data: Measure): Promise<void> {
    const prismaMeasure = PrismaMeasureMapper.toPrisma(data);
    await this.prisma.measure.update({
      where: { measure_uuid },
      data: prismaMeasure,
    });
  }

  async findByCustomerCodeAndType(customer_code: string, measure_type: string): Promise<Measure[]> {
    const measures = await this.prisma.measure.findMany({
      where: {
        customer_code,
        measure_type,
      },
    });

    return measures.map(PrismaMeasureMapper.toDomain);
  }

  async findByCustomerCode(customer_code: string): Promise<Measure[]> {
    const measures = await this.prisma.measure.findMany({
      where: { customer_code },
    });

    return measures.map(PrismaMeasureMapper.toDomain);
  }
}