import { mock, MockProxy } from 'jest-mock-extended';
import MockDate from 'mockdate';
import { PrismaClient } from '@prisma/client';
import { Measure } from '../entities/measure';
import { MeasureRepository } from './MeasureRepository';
import { UniqueEntityID } from '../@shared/unique-entity-id';

describe('MeasureRepository', () => {
  let prisma: MockProxy<PrismaClient>;
  let repository: MeasureRepository;

  beforeAll(() => {
    MockDate.set(new Date('2024-08-29T00:00:00Z'));
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(() => {
    prisma = mock<PrismaClient>();
    prisma.measure.create = jest.fn();
    prisma.measure.findUnique = jest.fn();
    prisma.measure.update = jest.fn();
    prisma.measure.findMany = jest.fn();
    repository = new MeasureRepository(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a measure', async () => {
    const measure = new Measure({
      customer_code: '12345',
      measure_datetime: new Date(),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false,
      measure_uuid: 'uuid'
    }, new UniqueEntityID('id'));

    await repository.create(measure);

    expect(prisma.measure.create).toHaveBeenCalledWith({
      data: {
        id: 'id',
        measure_uuid: 'uuid',
        customer_code: '12345',
        measure_datetime: new Date('2024-08-29T00:00:00Z'),
        measure_type: 'WATER',
        image_url: 'http://example.com/image.png',
        measure_value: 100,
        has_confirmed: false
      }
    });
  });

  it('should find a measure by id', async () => {
    const measureData = {
      id: 'id',
      measure_uuid: 'uuid',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false
    };

    (prisma.measure.findUnique as jest.Mock).mockResolvedValue(measureData);

    const measure = await repository.findById('id');

    expect(measure).toEqual(new Measure({
      customer_code: '12345',
      measure_datetime: measureData.measure_datetime,
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false,
      measure_uuid: 'uuid'
    }, new UniqueEntityID('id')));
  });

  it('should return null if measure not found by id', async () => {
    (prisma.measure.findUnique as jest.Mock).mockResolvedValue(null);

    const measure = await repository.findById('id');

    expect(measure).toBeNull();
  });

  it('should update a measure', async () => {
    const updateData = {
      measure_uuid: 'new-uuid',
      customer_code: 'new-code',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'GAS',
      image_url: 'http://example.com/new-image.png',
      measure_value: 200,
      has_confirmed: true
    };
  
    const measure = new Measure(updateData, new UniqueEntityID('id'));
    await repository.update('id', measure);
  
    expect(prisma.measure.update).toHaveBeenCalledWith({
      where: { id: 'id' },
      data: {
        measure_uuid: 'new-uuid',
        customer_code: 'new-code',
        measure_datetime: new Date('2024-08-29T00:00:00Z'),
        measure_type: 'GAS',
        image_url: 'http://example.com/new-image.png',
        measure_value: 200,
        has_confirmed: true
      }
    });
  });

  it('should find measures by customer code and type', async () => {
    const measureData = [{
      id: 'id',
      measure_uuid: 'uuid',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false
    }];

    (prisma.measure.findMany as jest.Mock).mockResolvedValue(measureData);

    const measures = await repository.findByCustomerCodeAndType('12345', 'WATER');

    expect(measures).toEqual(measureData.map(measure => new Measure({
      customer_code: '12345',
      measure_datetime: measure.measure_datetime,
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false,
      measure_uuid: 'uuid'
    }, new UniqueEntityID('id'))));
  });

  it('should find measures by customer code', async () => {
    const measureData = [{
      id: 'id',
      measure_uuid: 'uuid',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false
    }];

    (prisma.measure.findMany as jest.Mock).mockResolvedValue(measureData);

    const measures = await repository.findByCustomerCode('12345');

    expect(measures).toEqual(measureData.map(measure => new Measure({
      customer_code: '12345',
      measure_datetime: measure.measure_datetime,
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: 100,
      has_confirmed: false,
      measure_uuid: 'uuid'
    }, new UniqueEntityID('id'))));
  });

  it('should handle measure_value being undefined', async () => {
    const measureData = {
      id: 'id',
      measure_uuid: 'uuid',
      customer_code: '12345',
      measure_datetime: new Date('2024-08-29T00:00:00Z'),
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: undefined,
      has_confirmed: false
    };

    (prisma.measure.findUnique as jest.Mock).mockResolvedValue(measureData);

    const measure = await repository.findById('id');

    expect(measure).toEqual(new Measure({
      customer_code: '12345',
      measure_datetime: measureData.measure_datetime,
      measure_type: 'WATER',
      image_url: 'http://example.com/image.png',
      measure_value: undefined,
      has_confirmed: false,
      measure_uuid: 'uuid'
    }, new UniqueEntityID('id')));
  });
});