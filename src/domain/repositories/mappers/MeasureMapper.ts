import { UniqueEntityID } from '@/domain/@shared/unique-entity-id';
import { Measure } from '@/domain/entities/measure';
import { Measure as PrismaMeasure } from '@prisma/client';

export class PrismaMeasureMapper {
  static toDomain(raw: PrismaMeasure): Measure {
    return new Measure(
      {
        customer_code: raw.customer_code,
        measure_datetime: raw.measure_datetime,
        measure_type: raw.measure_type,
        image_url: raw.image_url,
        measure_value: raw.measure_value || undefined,
        has_confirmed: raw.has_confirmed,
        measure_uuid: raw.measure_uuid
      },
      new UniqueEntityID(raw.id)
    );
  }

  static toPrisma(measure: Measure): Omit<PrismaMeasure, 'id'> {
    return {
      measure_uuid: measure.measure_uuid,
      customer_code: measure.customer_code,
      measure_datetime: measure.measure_datetime,
      measure_type: measure.measure_type,
      image_url: measure.image_url,
      measure_value: measure.measure_value || null,
      has_confirmed: measure.has_confirmed,
    };
  }
}