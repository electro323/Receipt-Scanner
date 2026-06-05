import sharp from 'sharp';

export async function preprocessImage(inputPath: string): Promise<string> {
  const outputPath = inputPath + '-processed.png';

  await sharp(inputPath)
    .resize({ width: 1400, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(160)
    .png()
    .toFile(outputPath);

  return outputPath;
}