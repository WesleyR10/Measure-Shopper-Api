import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createServer } from '../src/infrastructure/server/createServer'; 
import { randomUUID } from 'node:crypto'

let server: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  server = await createServer(); // Use a função createServer para criar a instância do servidor
  await server.ready(); // Certifique-se de que o servidor está pronto antes de iniciar os testes
});

afterAll(async () => {
  await prisma.measure.deleteMany()
  await prisma.$disconnect();
  await server.close();
});

describe('Confirm Measure Controller E2E', () => {
  it('should confirm a measure successfully', async () => {
    const uniqueId = randomUUID();
    const uniqueUuid = randomUUID();

    const measure = await prisma.measure.create({
      data: {
        id: uniqueId,
        measure_uuid: uniqueUuid,
        customer_code: 'test-customer',
        measure_datetime: new Date(),
        measure_type: 'WATER',
        has_confirmed: false,
        image_url: 'http://example.com/image.png',
      },
    });
    
    const response = await supertest(server.server)
      .patch('/api/confirm') // Certifique-se de que o prefixo "/api" está correto
      .send({
        measure_uuid: measure.measure_uuid,
        confirmed_value: 100,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
    });

    const updatedMeasure = await prisma.measure.findUnique({
      where: { measure_uuid: measure.measure_uuid },
    });

    expect(updatedMeasure?.has_confirmed).toBe(true);
  });

  it('should return 400 for invalid data', async () => {
    const response = await supertest(server.server)
      .patch('/api/confirm') // Certifique-se de que o prefixo "/api" está correto
      .send({
        measure_uuid: '',
        confirmed_value: -10,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error_code: 'INVALID_DATA',
      error_description: expect.any(String),
    });
  });

  it('should return 500 for unexpected errors', async () => {
    jest.spyOn(prisma.measure, 'update').mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    const response = await supertest(server.server)
      .patch('/api/confirm') // Certifique-se de que o prefixo "/api" está correto
      .send({
        measure_uuid: 'test-uuid',
        confirmed_value: 100,
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error_code: 'INTERNAL_ERROR',
      error_description: 'An unexpected error occurred',
    });
  });
});