import { ConfirmMeasureUseCase } from '@/application/useCases/confirm-measure';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { IMeasureRepository } from '@/domain/repositories/contract/IMeasureRepository';

const confirmBodySchema = z.object({
  measure_uuid: z.string().nonempty("Measure UUID is required"),
  confirmed_value: z.number().min(0, "Confirmed value must be a positive number"),
});

type ConfirmBodySchema = z.infer<typeof confirmBodySchema>;

export const confirmMeasureController = (measureRepository: IMeasureRepository) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validar os parâmetros da requisição
      const validatedData: ConfirmBodySchema = confirmBodySchema.parse(request.body);
      const { measure_uuid, confirmed_value } = validatedData;

      const confirmMeasureUseCase = new ConfirmMeasureUseCase(measureRepository);
      const result = await confirmMeasureUseCase.execute({ measure_uuid, confirmed_value });

      return reply.status(200).send(result);
    } catch (error) {
      console.log(error);
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