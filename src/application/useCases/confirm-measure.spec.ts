import { mock, MockProxy } from 'jest-mock-extended';
import { ConfirmMeasureUseCase } from './confirm-measure';
import { IMeasureRepository } from '../../domain/repositories/contract/IMeasureRepository';
import { Measure } from '../../domain/entities/measure';

describe('ConfirmMeasureUseCase', () => {
  let measureRepository: MockProxy<IMeasureRepository>;
  let confirmMeasureUseCase: ConfirmMeasureUseCase;

  beforeEach(() => {
    measureRepository = mock<IMeasureRepository>();
    confirmMeasureUseCase = new ConfirmMeasureUseCase(measureRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if the measure does not exist', async () => {
    const request = {
      measure_uuid: 'non-existent-uuid',
      confirmed_value: 150
    };

    measureRepository.findById.mockResolvedValue(null);

    await expect(confirmMeasureUseCase.execute(request)).rejects.toEqual({
      statusCode: 404,
      code: 'MEASURE_NOT_FOUND',
      message: 'Leitura não encontrada'
    });
  });

  it('should throw an error if the measure is already confirmed', async () => {
    const request = {
      measure_uuid: 'existing-uuid',
      confirmed_value: 150
    };

    measureRepository.findById.mockResolvedValue(new Measure({
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: true,
      measure_uuid: 'existing-uuid'
    }));

    await expect(confirmMeasureUseCase.execute(request)).rejects.toEqual({
      statusCode: 409,
      code: 'CONFIRMATION_DUPLICATE',
      message: 'Leitura já confirmada'
    });
  });

  it('should confirm the measure successfully', async () => {
    const request = {
      measure_uuid: 'existing-uuid',
      confirmed_value: 150
    };

    const measure = new Measure({
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false,
      measure_uuid: 'existing-uuid'
    });

    measureRepository.findById.mockResolvedValue(measure);

    const result = await confirmMeasureUseCase.execute(request);

    expect(result).toEqual({ success: true });
    
    measure.measure_value = 150;
    measure.has_confirmed = true;

    expect(measureRepository.update).toHaveBeenCalledWith('existing-uuid', measure);
  });
});