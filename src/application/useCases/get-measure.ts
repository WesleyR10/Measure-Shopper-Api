import { IMeasureRepository } from "@/domain/repositories/contract/IMeasureRepository";

interface GetMeasuresRequest {
  customer_code: string;
  measure_type?: string;
}

export class GetMeasuresUseCase {
  constructor(private measureRepository: IMeasureRepository) {}

  async execute(request: GetMeasuresRequest) {
    const { customer_code, measure_type } = request;

    let measures;

    if (measure_type) {
      if (measure_type.toUpperCase() !== 'WATER' && measure_type.toUpperCase() !== 'GAS') {
        throw {
          statusCode: 400,
          code: 'INVALID_TYPE',
          message: 'Tipo de medição não permitida'
        };
      }

      measures = await this.measureRepository.findByCustomerCodeAndType(
        customer_code,
        measure_type.toUpperCase()
      );
    } else {
      measures = await this.measureRepository.findByCustomerCode(customer_code);
    }

    if (measures.length === 0) {
      throw {
        statusCode: 404,
        code: 'MEASURES_NOT_FOUND',
        message: 'Nenhuma leitura encontrada'
      };
    }

    return {
      customer_code,
      measures: measures.map(measure => ({
        measure_uuid: measure.measure_uuid,
        measure_datetime: measure.measure_datetime,
        measure_type: measure.measure_type,
        has_confirmed: measure.has_confirmed,
        image_url: measure.image_url
      }))
    };
  }
}