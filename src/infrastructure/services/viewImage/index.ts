import fs from 'fs';
import path from 'path';

export const saveImage = (imageBase64: string, imageUuid: string): string => {
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const imagePath = path.join(__dirname, '../../../temp', `${imageUuid}.jpg`); 
  // Certifique-se de que o diretório 'temp' existe
  if (!fs.existsSync(path.dirname(imagePath))) {
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
  }

  fs.writeFileSync(imagePath, imageBuffer);

  return `http://localhost:3000/temp/${imageUuid}.jpg`; // Ajuste conforme necessário
};