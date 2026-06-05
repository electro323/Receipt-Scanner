import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import * as Tesseract from 'tesseract.js';

import { processReceiptWithAI } from './ai.service';
import { enrichReceiptData } from './postprocess.service';
import { preprocessImage } from './image-preprocess.service';

import {
  prepareFileForOCR,
  extractPdfText,
} from './file-convert.service';

@Controller()
export class AppController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('receipt', {
      dest: './uploads',
    }),
  )
  async uploadReceipt(@UploadedFile() file: any) {
    console.log('Processing file:', file.path);

    console.time('OCR');

    // PDF DIRECT TEXT EXTRACTION
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

        console.log('PDF TEXT:');
        console.log(pdfText);

        if (
          pdfText &&
          pdfText.trim().length > 20
        ) {
          console.timeEnd('OCR');

          return {
            success: true,
            message:
              'PDF text extracted successfully',
            rawText: pdfText,
            confidence: 100,
          };
        }
      } catch (error) {
        console.error(
          'PDF TEXT EXTRACTION ERROR:',
          error,
        );
      }
    }

    // OCR PATH
    let imagePaths: string[] = [];

    try {
      imagePaths =
        await prepareFileForOCR(file);
    } catch (error) {
      console.error(
        'FILE CONVERSION ERROR:',
        error,
      );

      console.timeEnd('OCR');

      return {
        success: false,
        message:
          'Unable to process this file. Please upload a valid receipt image or PDF.',
      };
    }

    let combinedText = '';
    let totalConfidence = 0;

    for (const imagePath of imagePaths) {
      const processedImagePath =
        await preprocessImage(imagePath);

      const result =
        await Tesseract.recognize(
          processedImagePath,
          'eng+mal+hin+kan',
        );

      combinedText +=
        result.data.text + '\n';

      totalConfidence +=
        result.data.confidence;
    }

    console.timeEnd('OCR');

    const rawText =
      combinedText.trim();

    const averageConfidence =
      imagePaths.length > 0
        ? totalConfidence /
          imagePaths.length
        : 0;

    console.log('OCR Complete!');
    console.log(rawText);

    console.log(
      'Average Confidence:',
      averageConfidence,
    );

    // QUALITY VALIDATION

    if (averageConfidence < 20) {
      return {
        success: false,
        message:
          'Receipt could not be read. Please upload a clearer image.',
      };
    }

    if (rawText.length < 50) {
      return {
        success: false,
        message:
          'Receipt could not be read. Please upload a clearer image.',
      };
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
      return {
        success: false,
        message:
          'Receipt could not be read. Please upload a clearer image.',
      };
    }

    return {
      success: true,
      message: 'OCR successful',
      rawText,
      confidence:
        averageConfidence,
    };
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

    console.log('FINAL JSON:');
    console.log(finalData);

    return finalData;
  }
}