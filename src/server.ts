import { createServer } from "./infrastructure/server/createServer";
import { env } from "./config/env";

const startServer = async () => {
  let fastify;
  try {
    fastify = await createServer();
    const port = env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening at http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to connect to database');
    fastify?.log.error(error);
    process.exit(1);
  }
};

startServer();