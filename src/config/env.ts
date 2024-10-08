import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  SONAR_TOKEN: z.string().optional(),
  DOCKERHUB_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL inválida" }).default("postgresql://user:password@localhost:5432/shopper?schema=public"),
  GEMINI_API_KEY: z.string().nonempty({ message: "GEMINI_API_KEY é obrigatório" }),
});

const mappedEnv = {
  PORT: process.env.PORT,
  SONAR_TOKEN: process.env.SONAR_TOKEN,
  DOCKERHUB_TOKEN: process.env.DOCKERHUB_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

export type EnvInfer = z.infer<typeof envSchema>;

export const env: EnvInfer = envSchema.parse(mappedEnv);
