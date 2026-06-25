import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Receipt,
  ReceiptDocument,
} from './receipt.schema';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectModel(Receipt.name)
    private receiptModel: Model<ReceiptDocument>,
  ) {}

  // Create receipt immediately after upload
  async createReceipt(
    transactionId: string,
    filePath: string,
  ) {
    return this.receiptModel.create({
      transactionId,
      status: 'processing',
      filePath,
      receiptData: {},
      rawText: '',
      error: '',
    });
  }

  // Update OCR text
  async saveOCR(
    transactionId: string,
    rawText: string,
  ) {
    return this.receiptModel.findOneAndUpdate(
      { transactionId },
      {
        rawText,
      },
    );
  }

  // Save final AI JSON
  async saveAIResult(
    transactionId: string,
    receiptData: any,
  ) {
    return this.receiptModel.findOneAndUpdate(
      { transactionId },
      {
        receiptData,
        status: 'completed',
      },
    );
  }

  // Mark failed
  async markFailed(
    transactionId: string,
    error: string,
  ) {
    return this.receiptModel.findOneAndUpdate(
      { transactionId },
      {
        status: 'failed',
        error,
      },
    );
  }

  // Get one receipt
  async findByTransactionId(
    transactionId: string,
  ) {
    return this.receiptModel.findOne({
      transactionId,
    });
  }

  // History
  async findAll() {
    return this.receiptModel.find().sort({
      createdAt: -1,
    });
  }
  async updateReceiptData(
  transactionId: string,
  receiptData: any,
) {
  return this.receiptModel.findOneAndUpdate(
    { transactionId },
    {
      receiptData,
      status: 'completed',
    },
    { new: true },
  );
}
}
