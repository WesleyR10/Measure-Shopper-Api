import { IMeasureRepository } from "@/domain/repositories/contract/IMeasureRepository";

interface ConfirmRequest {
  measure_uuid: string;
  confirmed_value: number;
}

export class ConfirmMeasureUseCase {
  constructor(private measureRepository: IMeasureRepository) {}

  async execute(request: ConfirmRequest) {
    try {
      const { measure_uuid, confirmed_value } = request;
      const measure = await this.measureRepository.findByMeasureId(measure_uuid);

      // Verificar se o código de leitura informado existe
      if (!measure) {
        throw {
          statusCode: 404,
          code: 'MEASURE_NOT_FOUND',
          message: 'Leitura não encontrada'
        };
      }

      // Verificar se o código de leitura já foi confirmado
      if (measure.has_confirmed) {
        throw {
          statusCode: 409,
          code: 'CONFIRMATION_DUPLICATE',
          message: 'Leitura já confirmada'
        };
      }

      // Salvar no banco de dados o novo valor informado
      measure.measure_value = confirmed_value;
      measure.has_confirmed = true;

      await this.measureRepository.update(measure_uuid, measure);

      return { success: true };
    } catch (error) {
      console.log(error);	
      throw error;
    }
  }
}