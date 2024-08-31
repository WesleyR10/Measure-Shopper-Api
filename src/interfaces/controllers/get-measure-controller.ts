import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { IMeasureRepository } from '@/domain/repositories/contract/IMeasureRepository';
import { GetMeasuresUseCase } from '@/application/useCases/get-measure';

const getMeasuresParamsSchema = z.object({
  customer_code: z.string().min(1, "Customer code is required"),
});

const getMeasuresQuerySchema = z.object({
  measure_type: z.enum(["WATER", "GAS"]).optional().refine((val) => val === undefined || ["WATER", "GAS"].includes(val.toUpperCase()), {
    message: "Invalid measure type",
  }),
});

type GetMeasuresParamsSchema = z.infer<typeof getMeasuresParamsSchema>;
type GetMeasuresQuerySchema = z.infer<typeof getMeasuresQuerySchema>;

export const getMeasuresController = (measureRepository: IMeasureRepository) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validar os parâmetros da URL
      const params: GetMeasuresParamsSchema = getMeasuresParamsSchema.parse(request.params);
      // Validar os parâmetros de consulta
      const query: GetMeasuresQuerySchema = getMeasuresQuerySchema.parse(request.query);

      const { customer_code } = params;
      const { measure_type } = query;

      const getMeasuresUseCase = new GetMeasuresUseCase(measureRepository);

      const result = await getMeasuresUseCase.execute({
        customer_code,
        measure_type: measure_type?.toUpperCase(),
      });

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