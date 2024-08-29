// package.json
{
  "name": "shopper-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "ts-node-dev src/index.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.17.1",
    "prisma": "^3.0.0",
    "axios": "^0.24.0",
    "dotenv": "^10.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.13",
    "@types/node": "^16.11.7",
    "ts-node-dev": "^1.1.8",
    "typescript": "^4.4.4",
    "jest": "^27.3.1",
    "@types/jest": "^27.0.2",
    "ts-jest": "^27.0.7",
    "eslint": "^7.32.0",
    "prettier": "^2.4.1",
    "@prisma/client": "^3.0.0"
  }
}

// Dockerfile
FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/index.js"]

// docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: shopper

// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Measure {
  id             String   @id @default(uuid())
  customer_code  String
  measure_datetime DateTime
  measure_type   String
  image      String
  measure_value  Int
  has_confirmed  Boolean  @default(false)
}

// .env
DATABASE_URL="postgresql://user:password@localhost:5432/shopper"
GEMINI_API_KEY="your_gemini_api_key"

// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import routes from './interfaces/routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/api', routes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// src/interfaces/routes/index.ts
import { Router } from 'express';
import uploadController from '../controllers/uploadController';
import confirmController from '../controllers/confirmController';
import listController from '../controllers/listController';

const router = Router();

router.post('/upload', uploadController.upload);
router.patch('/confirm', confirmController.confirm);
router.get('/:customer_code/list', listController.list);

export default router;

// src/interfaces/controllers/uploadController.ts
import { Request, Response } from 'express';
import { UploadUseCase } from '../../application/useCases/UploadUseCase';

const upload = async (req: Request, res: Response) => {
  const { image, customer_code, measure_datetime, measure_type } = req.body;

  const uploadUseCase = new UploadUseCase();

  try {
    const result = await uploadUseCase.execute({
      image,
      customer_code,
      measure_datetime,
      measure_type
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error_code: error.code,
      error_description: error.message
    });
  }
};

export default { upload };

// src/interfaces/controllers/confirmController.ts
import { Request, Response } from 'express';
import { ConfirmUseCase } from '../../application/useCases/ConfirmUseCase';

const confirm = async (req: Request, res: Response) => {
  const { measure_uuid, confirmed_value } = req.body;

  const confirmUseCase = new ConfirmUseCase();

  try {
    await confirmUseCase.execute({
      measure_uuid,
      confirmed_value
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error_code: error.code,
      error_description: error.message
    });
  }
};

export default { confirm };

// src/interfaces/controllers/listController.ts
import { Request, Response } from 'express';
import { ListMeasuresUseCase } from '../../application/useCases/ListMeasuresUseCase';

const list = async (req: Request, res: Response) => {
  const { customer_code } = req.params;
  const { measure_type } = req.query;

  const listMeasuresUseCase = new ListMeasuresUseCase();

  try {
    const measures = await listMeasuresUseCase.execute({
      customer_code,
      measure_type: measure_type as string
    });

    return res.status(200).json({
      customer_code,
      measures
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error_code: error.code,
      error_description: error.message
    });
  }
};

export default { list };

// src/application/useCases/UploadUseCase.ts
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { MeasureRepository } from '../../domain/repositories/MeasureRepository';

const prisma = new PrismaClient();

interface UploadRequest {
  image: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: string;
}

export class UploadUseCase {
  private measureRepository: MeasureRepository;

  constructor() {
    this.measureRepository = new MeasureRepository(prisma);
  }

  async execute(request: UploadRequest) {
    const { image, customer_code, measure_datetime, measure_type } = request;

    // Verificar se já existe uma leitura no mês
    const existingMeasure = await this.measureRepository.findByCustomerCodeAndTypeAndMonth(
      customer_code,
      measure_type,
      measure_datetime
    );

    if (existingMeasure) {
      throw {
        statusCode: 409,
        code: 'DOUBLE_REPORT',
        message: 'Leitura do mês já realizada'
      };
    }

    // Integrar com a API do Google Gemini
    try {
      const response = await axios.post('https://ai.google.dev/gemini-api/vision', {
        image
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      });

      const { image, measure_value, measure_uuid } = response.data;

      // Salvar a medida no banco de dados
      await this.measureRepository.create({
        customer_code,
        measure_datetime,
        measure_type,
        image,
        measure_value,
        id: measure_uuid
      });

      return {
        image,
        measure_value,
        measure_uuid
      };
    } catch (error) {
      throw {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar a imagem'
      };
    }
  }
}

// src/application/useCases/ConfirmUseCase.ts
import { PrismaClient } from '@prisma/client';
import { MeasureRepository } from '../../domain/repositories/MeasureRepository';

const prisma = new PrismaClient();

interface ConfirmRequest {
  measure_uuid: string;
  confirmed_value: number;
}

export class ConfirmUseCase {
  private measureRepository: MeasureRepository;

  constructor() {
    this.measureRepository = new MeasureRepository(prisma);
  }

  async execute(request: ConfirmRequest) {
    const { measure_uuid, confirmed_value } = request;

    const measure = await this.measureRepository.findById(measure_uuid);

    if (!measure) {
      throw {
        statusCode: 404,
        code: 'MEASURE_NOT_FOUND',
        message: 'Leitura não encontrada'
      };
    }

    if (measure.has_confirmed) {
      throw {
        statusCode: 409,
        code: 'CONFIRMATION_DUPLICATE',
        message: 'Leitura já confirmada'
      };
    }

    await this.measureRepository.update(measure_uuid, {
      measure_value: confirmed_value,
      has_confirmed: true
    });
  }
}

// src/application/useCases/ListMeasuresUseCase.ts
import { PrismaClient } from '@prisma/client';
import { MeasureRepository } from '../../domain/repositories/MeasureRepository';

const prisma = new PrismaClient();

interface ListMeasuresRequest {
  customer_code: string;
  measure_type?: string;
}

export class ListMeasuresUseCase {
  private measureRepository: MeasureRepository;

  constructor() {
    this.measureRepository = new MeasureRepository(prisma);
  }

  async execute(request: ListMeasuresRequest) {
    const { customer_code, measure_type } = request;

    let measures;

    if (measure_type) {
      if (measure_type !== 'WATER' && measure_type !== 'GAS') {
        throw {
          statusCode: 400,
          code: 'INVALID_TYPE',
          message: 'Tipo de medição não permitida'
        };
      }

      measures = await this.measureRepository.findByCustomerCodeAndType(
        customer_code,
        measure_type
      );
    } else {
      measures = await this.measureRepository.findByCustomerCode(customer_code);
    }

    if (measures.length === 0) {
      throw {
        statusCode: 404,
        code: 'MEASURES_NOT_FOUND',
        message: 'Nenhuma leitura encontrada'
      };
    }

    return measures;
  }
}

// src/domain/entities/Measure.ts
export class Measure {
  id: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: string;
  image: string;
  measure_value: number;
  has_confirmed: boolean;

  constructor(
    id: string,
    customer_code: string,
    measure_datetime: Date,
    measure_type: string,
    image: string,
    measure_value: number,
    has_confirmed: boolean
  ) {
    this.id = id;
    this.customer_code = customer_code;
    this.measure_datetime = measure_datetime;
    this.measure_type = measure_type;
    this.image = image;
    this.measure_value = measure_value;
    this.has_confirmed = has_confirmed;
  }
}

// src/domain/repositories/MeasureRepository.ts
import { PrismaClient } from '@prisma/client';
import { Measure } from '../entities/Measure';

export class MeasureRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByCustomerCodeAndTypeAndMonth(
    customer_code: string,
    measure_type: string,
    measure_datetime: Date
  ): Promise<Measure | null> {
    const measure = await this.prisma.measure.findFirst({
      where: {
        customer_code,
        measure_type,
        measure_datetime: {
          gte: new Date(measure_datetime.getFullYear(), measure_datetime.getMonth(), 1),
          lt: new Date(measure_datetime.getFullYear(), measure_datetime.getMonth() + 1, 1)
        }
      }
    });

    if (!measure) return null;

    return new Measure(
      measure.id,
      measure.customer_code,
      measure.measure_datetime,
      measure.measure_type,
      measure.image,
      measure.measure_value,
      measure.has_confirmed
    );
  }

  async create(data: Measure): Promise<void> {
    await this.prisma.measure.create({
      data: {
        id: data.id,
        customer_code: data.customer_code,
        measure_datetime: data.measure_datetime,
        measure_type: data.measure_type,
        image: data.image,
        measure_value: data.measure_value,
        has_confirmed: data.has_confirmed
      }
    });
  }

  async findById(id: string): Promise<Measure | null> {
    const measure = await this.prisma.measure.findUnique({
      where: { id }
    });

    if (!measure) return null;

    return new Measure(
      measure.id,
      measure.customer_code,
      measure.measure_datetime,
      measure.measure_type,
      measure.image,
      measure.measure_value,
      measure.has_confirmed
    );
  }

  async update(id: string, data: Partial<Measure>): Promise<void> {
    await this.prisma.measure.update({
      where: { id },
      data
    });
  }

  async findByCustomerCodeAndType(
    customer_code: string,
    measure_type: string
  ): Promise<Measure[]> {
    const measures = await this.prisma.measure.findMany({
      where: {
        customer_code,
        measure_type
      }
    });

    return measures.map(
      measure =>
        new Measure(
          measure.id,
          measure.customer_code,
          measure.measure_datetime,
          measure.measure_type,
          measure.image,
          measure.measure_value,
          measure.has_confirmed
        )
    );
  }

  async findByCustomerCode(customer_code: string): Promise<Measure[]> {
    const measures = await this.prisma.measure.findMany({
      where: { customer_code }
    });

    return measures.map(
      measure =>
        new Measure(
          measure.id,
          measure.customer_code,
          measure.measure_datetime,
          measure.measure_type,
          measure.image,
          measure.measure_value,
          measure.has_confirmed
        )
    );
  }
}

// tests/uploadController.test.ts
import request from 'supertest';
import { app } from '../src/index';

describe('POST /upload', () => {
  it('should return 200 and the measure data', async () => {
    const response = await request(app)
      .post('/api/upload')
      .send({
        image: 'base64string',
        customer_code: '12345',
        measure_datetime: new Date(),
        measure_type: 'WATER'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('image');
    expect(response.body).toHaveProperty('measure_value');
    expect(response.body).toHaveProperty('measure_uuid');
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/upload')
      .send({
        image: '',
        customer_code: '',
        measure_datetime: '',
        measure_type: ''
      });

    expect(response.status).toBe(400);
    expect(response.body.error_code).toBe('INVALID_DATA');
  });

  it('should return 409 for duplicate report', async () => {
    // Simular uma leitura existente no banco de dados
    // ...

    const response = await request(app)
      .post('/api/upload')
      .send({
        image: 'base64string',
        customer_code: '12345',
        measure_datetime: new Date(),
        measure_type: 'WATER'
      });

    expect(response.status).toBe(409);
    expect(response.body.error_code).toBe('DOUBLE_REPORT');
  });
});