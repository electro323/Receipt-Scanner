import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as Tesseract from 'tesseract.js';
import { detectOCRLanguage } from './ocr-language.service';

import { ReceiptService } from './receipts/receipt.service';
import { processReceiptWithAI } from './ai.service';
import { enrichReceiptData } from './postprocess.service';
import { preprocessImage } from './image-preprocess.service';

import {
  prepareFileForOCR,
  extractPdfText,
} from './file-convert.service';

@Controller()
export class AppController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('receipt', {
      dest: './uploads',
    }),
  )
 async uploadReceipt(@UploadedFile() file: any) {
    console.log('UPLOAD ROUTE HIT');
    console.log('Processing file:', file.path);

    const transactionId = 'TXN-' + Date.now();
   

    await this.receiptService.createReceipt(
      transactionId,
      file.path,
    );

    console.log('Transaction ID:', transactionId);

   this.processReceiptInBackground(file, transactionId);

    return {
      success: true,
      transactionId,
      status: 'processing',
      message: 'Receipt uploaded. Processing started.',
    };
  }

private async processReceiptInBackground(
  file: any,
  transactionId: string,
) 
{
    try {
      console.time(`OCR-${transactionId}`);

      let rawText = '';
      let averageConfidence = 0;

      if (
        file.originalname
          .toLowerCase()
          .endsWith('.pdf')
      ) {
        try {
          const pdfText =
            await extractPdfText(file.path);

          console.log(
            'PDF TEXT LENGTH:',
            pdfText.length,
          );

          if (
            pdfText &&
            pdfText.trim().length > 20
          ) {
            rawText = pdfText.trim();
            averageConfidence = 100;
          }
        } catch (error) {
          console.error(
            'PDF TEXT EXTRACTION ERROR:',
            error,
          );
        }
      }

      if (!rawText) {
        let imagePaths: string[] = [];

        try {
          imagePaths =
            await prepareFileForOCR(file);
        } catch (error) {
          console.error(
            'FILE CONVERSION ERROR:',
            error,
          );

          await this.receiptService.markFailed(
            transactionId,
            'Unable to process this file. Please upload a valid receipt image or PDF.',
          );

          return;
        }

        let combinedText = '';
        let totalConfidence = 0;

        for (const imagePath of imagePaths) {
          const processedImagePath =
            await preprocessImage(imagePath);

          const sampleResult = await Tesseract.recognize(
  processedImagePath,
  'eng',
);

let detectedLanguage = detectOCRLanguage(sampleResult.data.text);

if (detectedLanguage === 'eng' && sampleResult.data.confidence < 60) {
  const multiSample = await Tesseract.recognize(
    processedImagePath,
    'kan+mal+hin',
  );

  detectedLanguage = detectOCRLanguage(multiSample.data.text);
}

console.log('Detected OCR Language:', detectedLanguage);

const result = await Tesseract.recognize(
  processedImagePath,
  detectedLanguage,
);

          combinedText +=
            result.data.text + '\\n';

          totalConfidence +=
            result.data.confidence;
        }

        rawText = combinedText.trim();

        averageConfidence =
          imagePaths.length > 0
            ? totalConfidence /
              imagePaths.length
            : 0;
      }

      console.timeEnd(`OCR-${transactionId}`);

      console.log('OCR Complete!');
      console.log(rawText);

      console.log(
        'Average Confidence:',
        averageConfidence,
      );

      if (averageConfidence < 20) {
        await this.receiptService.markFailed(
          transactionId,
          'Receipt could not be read. Please upload a clearer image.',
        );

        return;
      }

      if (rawText.length < 50) {
        await this.receiptService.markFailed(
          transactionId,
          'Receipt could not be read. Please upload a clearer image.',
        );

        return;
      }

      const receiptKeywords = [
        'TOTAL',
        'SUBTOTAL',
        'TAX',
        'RECEIPT',
        'INVOICE',
        'RS',
        '$',
        '₹',
        'UPI',
        'FARE',
        'AMOUNT',
        'BALANCE',
        'CARD',
        'CASH',
        'VISA',
        'PAID',
        'QTY',
        'PRICE',
        'ITEM',
      ];

      const foundKeywords =
        receiptKeywords.filter(
          keyword =>
            rawText
              .toUpperCase()
              .includes(keyword),
        );

      if (foundKeywords.length === 0) {
        await this.receiptService.markFailed(
          transactionId,
          'Receipt could not be read. Please upload a clearer image.',
        );

        return;
      }

      await this.receiptService.saveOCR(
        transactionId,
        rawText,
      );

      console.time(`AI-${transactionId}`);

      const aiResponse =
        await processReceiptWithAI(rawText);

      console.timeEnd(`AI-${transactionId}`);

      console.log('AI RESPONSE:');
      console.log(aiResponse);

      const structuredData =
        JSON.parse(aiResponse);

      const finalData =
        enrichReceiptData(
          structuredData,
          rawText,
        );

      await this.receiptService.saveAIResult(
        transactionId,
        finalData,
      );

      console.log('FINAL JSON:');
      console.log(finalData);
    } catch (error) {
      console.error('BACKGROUND PROCESSING ERROR:', error);

      await this.receiptService.markFailed(
        transactionId,
        error instanceof Error
          ? error.message
          : String(error),
      );
    }
  }

  @Post('process-ai')
  async processAI(@Body() body: any) {
    console.time('AI');

    const aiResponse =
      await processReceiptWithAI(
        body.rawText,
      );

    console.timeEnd('AI');

    console.log('AI RESPONSE:');
    console.log(aiResponse);

    const structuredData =
      JSON.parse(aiResponse);

    const finalData =
      enrichReceiptData(
        structuredData,
        body.rawText,
      );

    if (body.transactionId) {
      await this.receiptService.saveAIResult(
        body.transactionId,
        finalData,
      );
    }

    console.log('FINAL JSON:');
    console.log(finalData);

    return finalData;
  }
  @Put('receipt/:transactionId')
async updateReceipt(
  @Param('transactionId') transactionId: string,
  @Body() receiptData: any,
) {
  return this.receiptService.updateReceiptData(
    transactionId,
    receiptData,
  );
}

  @Get('receipt/:transactionId')
  async getReceipt(
    @Param('transactionId') transactionId: string,
  ) {
    return this.receiptService.findByTransactionId(
      transactionId,
    );
  }

  @Get('receipts')
  async getReceipts() {
    return this.receiptService.findAll();
  }
}
