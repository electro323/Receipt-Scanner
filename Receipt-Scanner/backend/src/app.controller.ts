import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as Tesseract from 'tesseract.js';

@Controller()
export class AppController {
  
  @Post('upload')
  @UseInterceptors(FileInterceptor('receipt', { dest: './uploads' }))
  async uploadReceipt(@UploadedFile() file: any) {
    console.log('Processing file:', file.path);

    // Notice the new 'logger' line added here!
    const result = await Tesseract.recognize(file.path, 'eng', {
      logger: m => console.log(m) 
    });
    
    console.log('OCR Complete!');

    return {
      message: 'Scan successful',
      rawText: result.data.text,
      confidence: result.data.confidence
    };
  }
}
