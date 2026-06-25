import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReceiptDocument = Receipt & Document;

@Schema({ timestamps: true })
export class Receipt {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ default: 'processing' })
  status: string;

  @Prop()
  filePath: string;

  @Prop({ type: Object, default: {} })
  receiptData: any;

  @Prop({ default: '' })
  rawText: string;

  @Prop({ default: '' })
  error: string;
}

export const ReceiptSchema = SchemaFactory.createForClass(Receipt);