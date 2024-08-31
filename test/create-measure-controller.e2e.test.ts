import { PrismaClient } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createServer } from '../src/infrastructure/server/createServer'; 

import fs from 'fs';
import path from 'path';

let server: FastifyInstance;
let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  server = await createServer(); // Use a função createServer para criar a instância do servidor
  await server.ready(); // Certifique-se de que o servidor está pronto antes de iniciar os testes
}, 10000); // Aumentar o timeout para 10 segundos

afterAll(async () => {
  await prisma.measure.deleteMany()
  await prisma.$disconnect();
  await server.close();
}, 10000); // Aumentar o timeout para 10 segundos

describe('Upload Measure Controller E2E', () => {
  it('should upload a measure successfully', async () => {
    // Carregar a imagem do medidor de água e convertê-la para base64
    const imagePath = path.join(__dirname, '../src/assets/measure-water.png');
    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    const response = await supertest(server.server)
      .post('/api/upload') // Certifique-se de que o prefixo "/api" está correto
      .send({
        image: imageBase64, // Use a imagem do medidor de água em base64
        customer_code: 'test-customer',
        measure_datetime: new Date('2024-07-25T00:00:00Z'),
        measure_type: 'WATER',
      });

      console.log("response Test successfully", response.body);	

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      image_url: expect.any(String),
      measure_value: expect.any(Number),
      measure_uuid: expect.any(String),
    });

    const createdMeasure = await prisma.measure.findUnique({
      where: { measure_uuid: response.body.measure_uuid },
    });

    expect(createdMeasure).not.toBeNull();
    expect(createdMeasure?.customer_code).toBe('test-customer');
    expect(createdMeasure?.measure_type).toBe('WATER');
  }, 10000); // Aumentar o timeout para 10 segundos

  it('should return 400 for invalid data', async () => {
    const response = await supertest(server.server)
      .post('/api/upload') // Certifique-se de que o prefixo "/api" está correto
      .send({
        image: 'invalid-base64',
        customer_code: '',
        measure_datetime: 'invalid-date',
        measure_type: 'INVALID_TYPE',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error_code: 'INVALID_DATA',
      error_description: expect.any(String),
    });
  }, 10000); // Aumentar o timeout para 10 segundos
});