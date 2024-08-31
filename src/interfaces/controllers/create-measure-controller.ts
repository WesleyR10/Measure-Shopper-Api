import { UploadUseCase } from '@/application/useCases/create-measure';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { IMeasureRepository } from '@/domain/repositories/contract/IMeasureRepository';
import { GeminiApi } from '@/infrastructure/services/geminiApi';

const uploadBodySchema = z.object({
  image: z.string().base64("Invalid base64 format"),
  customer_code: z.string().min(1, "Customer code is required"),
  measure_datetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  measure_type: z.union([z.literal("WATER"), z.literal("GAS")]) ,
});

type UploadBodySchema = z.infer<typeof uploadBodySchema>;

export const uploadController = (measureRepository: IMeasureRepository, geminiApi: GeminiApi) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validar os parâmetros da requisição
      const validatedData: UploadBodySchema = uploadBodySchema.parse(request.body);

      const { image, customer_code, measure_datetime, measure_type } = validatedData;

      const uploadUseCase = new UploadUseCase(measureRepository, geminiApi);

      const result = await uploadUseCase.execute({
        image,
        customer_code,
        measure_datetime: new Date(measure_datetime),
        measure_type,
      });

      console.log("Controller: Upload realizado com sucesso:", result);
      return reply.status(200).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error_code: "INVALID_DATA",
          error_description: error.errors.map((err) => err.message).join(", "),
        });
      }

      if (error instanceof Error && 'statusCode' in error && 'code' in error) {
        return reply.status((error as any).statusCode || 500).send({
          error_code: (error as any).code,
          error_description: error.message,
        });
      }

      return reply.status(500).send({
        error_code: "INTERNAL_ERROR",
        error_description: "An unexpected error occurred",
      });
    }
  };
};