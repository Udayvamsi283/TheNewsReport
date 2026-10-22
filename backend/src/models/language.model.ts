import mongoose, { Schema, Document } from 'mongoose';

export type LanguageStatus = 'active' | 'inactive';

export interface ILanguage extends Document {
  name: string;
  code: string;
  isDefault: boolean;
  status: LanguageStatus;
  createdAt: Date;
  updatedAt: Date;
}

const languageSchema = new Schema<ILanguage>(
  {
    name: {
      type: String,
      required: [true, 'Language name is required'],
      trim: true,
      maxlength: [50, 'Language name cannot exceed 50 characters']
    },
    code: {
      type: String,
      required: [true, 'Language code is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z]{2,5}(-[a-z0-9]+)?$/, 'Language code must be standard ISO format (e.g. en, hi, te)']
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);



export const Language = mongoose.model<ILanguage>('Language', languageSchema);
