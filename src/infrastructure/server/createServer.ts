import Fastify, { FastifyInstance } from "fastify";
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { measureRoutes } from "../../interfaces/routes/MeasureRoutes";
import path from 'path';
import fastifyStatic from '@fastify/static';

export const createServer = async (): Promise<FastifyInstance> => {
  const fastify: FastifyInstance = Fastify({ 
    logger: true,
    bodyLimit: 10485760 // 10MB
  });

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../temp'), 
    prefix: '/temp/',
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false,
    global: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '5 minute',
  });

  // Registrar rotas
  fastify.register(measureRoutes, { prefix: "/api" });

  return fastify;
};