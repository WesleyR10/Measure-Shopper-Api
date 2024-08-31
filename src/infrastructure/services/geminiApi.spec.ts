import { GeminiApi } from './geminiApi';
import path from 'path';
import fs from "fs";

describe('GeminiApi', () => {
  const apiKey = "AIzaSyAcPc2Ypypc2c90KrwgtAew9LOWIBvHfjk";
  const geminiApi = new GeminiApi(apiKey);
  const imagePath = path.join(__dirname, '../../assets/measure-water.png');
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  it('should analyze the image and return the result', async () => {

    try {
      const result = await geminiApi.analyzeImage(imageBase64, 'WATER');
      expect(result).toBeDefined();
    } catch (error) {
      console.error("Erro ao analisar a imagem:", error);
      throw error;
    }
  });
});