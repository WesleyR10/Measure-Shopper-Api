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

  prisma:
    image: prismagraphql/prisma:1.34
    ports:
      - "4466:4466"
    environment:
      PRISMA_CONFIG: |
        port: 4466
        databases:
          default:
            connector: postgres
            host: db
            database: shopper
            user: user
            password: password

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
import routes from './routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/api', routes);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// src/routes/index.ts
import { Router } from 'express';
import uploadController from '../controllers/uploadController';
import confirmController from '../controllers/confirmController';
import listController from '../controllers/listController';

const router = Router();

router.post('/upload', uploadController.upload);
router.patch('/confirm', confirmController.confirm);
router.get('/:customer_code/list', listController.list);

export default router;

// src/controllers/uploadController.ts
import { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const upload = async (req: Request, res: Response) => {
  const { image, customer_code, measure_datetime, measure_type } = req.body;

  // Validar os dados recebidos
  if (!image || !customer_code || !measure_datetime || !measure_type) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Dados inválidos'
    });
  }

  // Verificar se já existe uma leitura no mês
  const existingMeasure = await prisma.measure.findFirst({
    where: {
      customer_code,
      measure_type,
      measure_datetime: {
        gte: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth(), 1),
        lt: new Date(new Date(measure_datetime).getFullYear(), new Date(measure_datetime).getMonth() + 1, 1)
      }
    }
  });

  if (existingMeasure) {
    return res.status(409).json({
      error_code: 'DOUBLE_REPORT',
      error_description: 'Leitura do mês já realizada'
    });
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
    const newMeasure = await prisma.measure.create({
      data: {
        customer_code,
        measure_datetime: new Date(measure_datetime),
        measure_type,
        image,
        measure_value,
        id: measure_uuid
      }
    });

    return res.status(200).json({
      image,
      measure_value,
      measure_uuid
    });
  } catch (error) {
    return res.status(500).json({
      error_code: 'INTERNAL_ERROR',
      error_description: 'Erro ao processar a imagem'
    });
  }
};

export default { upload };

// src/controllers/confirmController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const confirm = async (req: Request, res: Response) => {
  const { measure_uuid, confirmed_value } = req.body;

  // Validar os dados recebidos
  if (!measure_uuid || !confirmed_value) {
    return res.status(400).json({
      error_code: 'INVALID_DATA',
      error_description: 'Dados inválidos'
    });
  }

  const measure = await prisma.measure.findUnique({
    where: { id: measure_uuid }
  });

  if (!measure) {
    return res.status(404).json({
      error_code: 'MEASURE_NOT_FOUND',
      error_description: 'Leitura não encontrada'
    });
  }

  if (measure.has_confirmed) {
    return res.status(409).json({
      error_code: 'CONFIRMATION_DUPLICATE',
      error_description: 'Leitura já confirmada'
    });
  }

  await prisma.measure.update({
    where: { id: measure_uuid },
    data: {
      measure_value: confirmed_value,
      has_confirmed: true
    }
  });

  return res.status(200).json({ success: true });
};

export default { confirm };

// src/controllers/listController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const list = async (req: Request, res: Response) => {
  const { customer_code } = req.params;
  const { measure_type } = req.query;

  let measures;

  if (measure_type) {
    if (measure_type !== 'WATER' && measure_type !== 'GAS') {
      return res.status(400).json({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida'
      });
    }

    measures = await prisma.measure.findMany({
      where: {
        customer_code,
        measure_type: measure_type as string
      }
    });
  } else {
    measures = await prisma.measure.findMany({
      where: { customer_code }
    });
  }

  if (measures.length === 0) {
    return res.status(404).json({
      error_code: 'MEASURES_NOT_FOUND',
      error_description: 'Nenhuma leitura encontrada'
    });
  }

  return res.status(200).json({
    customer_code,
    measures
  });
};

export default { list };

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