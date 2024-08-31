import { Measure } from '../../domain/entities/measure';
import { IMeasureRepository } from '../../domain/repositories/contract/IMeasureRepository';
import { GeminiApi } from '../../infrastructure/services/geminiApi';

interface UploadRequest {
  image: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: 'WATER' | 'GAS';
}

export class UploadUseCase {
  constructor(
    private measureRepository: IMeasureRepository,
    private geminiApi: GeminiApi
  ) {}

  async execute(request: UploadRequest) {
    const { image, customer_code, measure_datetime, measure_type } = request;

    // Verificar se já existe uma leitura no mês
    const existingMeasures = await this.measureRepository.findByCustomerCodeAndType(customer_code, measure_type);
    console.log("Use Case: Medidas existentes encontradas:", existingMeasures);
    
    const existingMeasure = existingMeasures.find(measure => {
      const measureDate = new Date(measure.measure_datetime);
      console.log(`Comparando datas: ${measureDate} e ${measure_datetime}`);
      return measureDate.getMonth() === measure_datetime.getMonth() &&
             measureDate.getFullYear() === measure_datetime.getFullYear();
    });

    if (existingMeasure) {
      console.log("Use Case: Leitura do mês já realizada");
      throw {
        statusCode: 409,
        code: 'DOUBLE_REPORT',
        message: 'Leitura do mês já realizada'
      };
    }

    try {
      // Integrar com a API do Google Gemini
      const geminiResponse = await this.geminiApi.analyzeImage(image, measure_type);
      console.log("Use Case: Resposta da API Gemini:", geminiResponse);

      // Criar a entidade Measure
      const measure = new Measure({
        customer_code,
        measure_datetime,
        measure_type,
        image_url: geminiResponse.imageUrl,
        measure_value: geminiResponse.measureValue,
        has_confirmed: false,
        measure_uuid: geminiResponse.measureUuid
      });

      // Salvar a medida no banco de dados
      await this.measureRepository.create(measure);
      console.log("Use Case: Medida criada com sucesso");

      return {
        image_url: geminiResponse.imageUrl,
        measure_value: geminiResponse.measureValue,
        measure_uuid: geminiResponse.measureUuid
      };
    } catch (error) {
      console.error("Use Case: Erro ao processar a imagem:", error);
      throw {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar a imagem'
      };
    }
  }
}