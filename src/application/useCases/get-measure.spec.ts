import { mock, MockProxy } from 'jest-mock-extended';
import { GetMeasuresUseCase } from './get-measure';
import { IMeasureRepository } from '../../domain/repositories/contract/IMeasureRepository';
import { Measure } from '../../domain/entities/measure';

describe('GetMeasuresUseCase', () => {
  let measureRepository: MockProxy<IMeasureRepository>;
  let getMeasuresUseCase: GetMeasuresUseCase;

  beforeEach(() => {
    measureRepository = mock<IMeasureRepository>();
    getMeasuresUseCase = new GetMeasuresUseCase(measureRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return measures for a specific customer', async () => {
    const request = {
      customer_code: '12345'
    };

    const measures = [
      new Measure({
        customer_code: '12345',
        measure_datetime: new Date('2024-08-29T00:00:00Z'),
        measure_type: 'WATER',
        image_url: 'http://example.com/image.png',
        measure_value: 100,
        has_confirmed: false,
        measure_uuid: 'uuid-1'
      })
    ];

    measureRepository.findByCustomerCode.mockResolvedValue(measures);

    const result = await getMeasuresUseCase.execute(request);

    expect(result).toEqual({
      customer_code: '12345',
      measures: measures.map(measure => ({
        measure_uuid: measure.measure_uuid,
        measure_datetime: measure.measure_datetime,
        measure_type: measure.measure_type,
        has_confirmed: measure.has_confirmed,
        image_url: measure.image_url
      }))
    });
  });

  it('should return measures for a specific customer and measure type', async () => {
    const request = {
      customer_code: '12345',
      measure_type: 'WATER'
    };

    const measures = [
      new Measure({
        customer_code: '12345',
        measure_datetime: new Date('2024-08-29T00:00:00Z'),
        measure_type: 'WATER',
        image_url: 'http://example.com/image.png',
        measure_value: 100,
        has_confirmed: false,
        measure_uuid: 'uuid-1'
      })
    ];

    measureRepository.findByCustomerCodeAndType.mockResolvedValue(measures);

    const result = await getMeasuresUseCase.execute(request);

    expect(result).toEqual({
      customer_code: '12345',
      measures: measures.map(measure => ({
        measure_uuid: measure.measure_uuid,
        measure_datetime: measure.measure_datetime,
        measure_type: measure.measure_type,
        has_confirmed: measure.has_confirmed,
        image_url: measure.image_url
      }))
    });
  });

  it('should throw an error if measure type is invalid', async () => {
    const request = {
      customer_code: '12345',
      measure_type: 'INVALID'
    };

    await expect(getMeasuresUseCase.execute(request)).rejects.toEqual({
      statusCode: 400,
      code: 'INVALID_TYPE',
      message: 'Tipo de medição não permitida'
    });
  });

  it('should throw an error if no measures are found', async () => {
    const request = {
      customer_code: '12345'
    };

    measureRepository.findByCustomerCode.mockResolvedValue([]);

    await expect(getMeasuresUseCase.execute(request)).rejects.toEqual({
      statusCode: 404,
      code: 'MEASURES_NOT_FOUND',
      message: 'Nenhuma leitura encontrada'
    });
  });
});