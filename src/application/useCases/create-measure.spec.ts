import { mock, MockProxy } from 'jest-mock-extended';
import MockDate from 'mockdate';
import { IMeasureRepository } from '../../domain/repositories/contract/IMeasureRepository';
import { Measure } from '../../domain/entities/measure';
import { UploadUseCase } from './create-measure';
import axios from 'axios';

// Simula a resposta da API do Google Gemini
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UploadUseCase', () => {
  let measureRepository: MockProxy<IMeasureRepository>;
  let uploadUseCase: UploadUseCase;

  beforeAll(() => {
    MockDate.set(new Date('2024-08-29T00:00:00Z'));
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    measureRepository = mock<IMeasureRepository>();
    uploadUseCase = new UploadUseCase(measureRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if a measure already exists for the same month', async () => {
    const request = {
      image: 'image-data',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER'
    };

    measureRepository.findByCustomerCodeAndType.mockResolvedValue([
      new Measure({
        customer_code: '12345',
        measure_datetime: new Date('2024-08-30T00:00:00Z'),
        measure_type: 'WATER',
        image_url: 'http://example.com/image.png',
        measure_value: 100,
        has_confirmed: false,
        measure_uuid: 'uuid'
      })
    ]);

    await expect(uploadUseCase.execute(request)).rejects.toEqual({
      statusCode: 409,
      code: 'DOUBLE_REPORT',
      message: 'Leitura do mês já realizada'
    });
  });

  it('should integrate with Google Gemini API and create a new measure', async () => {
    const request = {
      image: 'image-data',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER'
    };

    measureRepository.findByCustomerCodeAndType.mockResolvedValue([]);

    // Simula a chamada à API do Google Gemini
    mockedAxios.post.mockResolvedValue({
      data: {
        image: 'http://example.com/image.png',
        measure_value: 100,
        measure_uuid: 'uuid'
      }
    });

    const result = await uploadUseCase.execute(request);

    expect(result).toEqual({
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      measure_uuid: 'uuid'
    });

    expect(measureRepository.create).toHaveBeenCalledWith(expect.any(Measure));
  });

  it('should throw an error if Google Gemini API fails', async () => {
    const request = {
      image: 'image-data',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER'
    };

    measureRepository.findByCustomerCodeAndType.mockResolvedValue([]);

    // Simula uma falha na chamada à API do Google Gemini
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    await expect(uploadUseCase.execute(request)).rejects.toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erro ao processar a imagem'
    });
  });
});