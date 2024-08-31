import { FastifyInstance } from "fastify";
import { MeasureRepository } from '@/domain/repositories/MeasureRepository';
import { uploadController } from '@/interfaces/controllers/create-measure-controller';
import { confirmMeasureController } from '@/interfaces/controllers/confirm-measure-controller';
import { getMeasuresController } from '@/interfaces/controllers/get-measure-controller';
import { PrismaClient } from "@prisma/client";
import { GeminiApi } from "@/infrastructure/services/geminiApi";
import { env } from "@/config/env";

export async function measureRoutes(fastify: FastifyInstance, options: any) {
  const prisma = new PrismaClient();
  const measureRepository = new MeasureRepository(prisma);
  const geminiApi = new GeminiApi(env.GEMINI_API_KEY);

  fastify.post('/upload', uploadController(measureRepository, geminiApi));
  fastify.patch('/confirm', confirmMeasureController(measureRepository));
  fastify.get('/:customer_code/list', getMeasuresController(measureRepository));
}