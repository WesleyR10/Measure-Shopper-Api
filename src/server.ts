import Fastify, { FastifyInstance } from "fastify";
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from "./config/env";
import { measureRoutes } from "./interfaces/routes/MeasureRoutes";

export const createServer = async (): Promise<FastifyInstance> => {
  const fastify: FastifyInstance = Fastify({ logger: true });

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

const startServer = async () => {
  let fastify: FastifyInstance | undefined;
  try {
    fastify = await createServer();
    const port = env?.port ?? 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening at http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to connect to database');
    fastify?.log.error(error);
    process.exit(1);
  }
};

startServer();