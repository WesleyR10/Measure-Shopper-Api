import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from "./viewImage";

export class GeminiApi {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeImage(imageBase64: string, meterType: 'WATER' | 'GAS'): Promise<{ imageUrl: string, measureValue: number, measureUuid: string }> {
    try {
      console.log("GeminiApi: Iniciando análise da imagem base64:");

      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Modelo obtido:", model);

      const prompt = meterType === 'WATER' ? "What is the reading on this water meter?" : "What is the reading on this gas meter?";
      const image = {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      };

      console.log("Enviando solicitação para a API");
      const result = await model.generateContent([prompt, image]);
      const responseText = result.response.text();
      console.log("Resposta da API recebida:", responseText);

      // Extrair o valor numérico da resposta
      const match = responseText.match(/\d+(\.\d+)?/);
      const measureValue = match ? parseFloat(match[0]) : 0;
      const measureUuid = uuidv4();

      // Salvar a imagem e obter a URL
      const imageUrl = saveImage(imageBase64, measureUuid);

      return { imageUrl, measureValue, measureUuid };
    } catch (error: any) {
      if (error.response) {
        console.error("Erro na resposta da API:", error.response.data);
      } else if (error.request) {
        console.error("Erro na solicitação para a API:", error.request);
      } else {
        console.error("Erro ao configurar a solicitação:", error.message);
      }

      throw error;
    }
  }
}