import { Measure } from '../../domain/entities/measure';
import { IMeasureRepository } from '../../domain/repositories/contract/IMeasureRepository';
import axios from 'axios';

interface UploadRequest {
  image: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: string;
}

interface GeminiApiResponse {
  image: string;
  measure_value: number;
  measure_uuid: string;
}

export class UploadUseCase {
  constructor(private measureRepository: IMeasureRepository) {}

  async execute(request: UploadRequest) {
    const { image, customer_code, measure_datetime, measure_type } = request;

    // Verificar se já existe uma leitura no mês
    const existingMeasures = await this.measureRepository.findByCustomerCodeAndType(customer_code, measure_type);
    const existingMeasure = existingMeasures.find(measure => 
      measure.measure_datetime.getMonth() === measure_datetime.getMonth() &&
      measure.measure_datetime.getFullYear() === measure_datetime.getFullYear()
    );

    if (existingMeasure) {
      throw {
        statusCode: 409,
        code: 'DOUBLE_REPORT',
        message: 'Leitura do mês já realizada'
      };
    }

    // Integrar com a API do Google Gemini
    const geminiResponse = await this.integrateWithGeminiApi(image);

    // Criar a entidade Measure
    const measure = new Measure({
      customer_code,
      measure_datetime,
      measure_type,
      image_url: geminiResponse.image,
      measure_value: geminiResponse.measure_value,
      has_confirmed: false,
      measure_uuid: geminiResponse.measure_uuid
    });

    // Salvar a medida no banco de dados
    await this.measureRepository.create(measure);

    return {
      image_url: geminiResponse.image,
      measure_value: geminiResponse.measure_value,
      measure_uuid: geminiResponse.measure_uuid
    };
  }

  private async integrateWithGeminiApi(image: string): Promise<GeminiApiResponse> {
    try {
      const response = await axios.post('https://ai.google.dev/gemini-api/vision', {
        image
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      });

      return response.data;
    } catch (error) {
      throw {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar a imagem'
      };
    }
  }
}