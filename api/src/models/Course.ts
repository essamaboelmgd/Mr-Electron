import mongoose, { Document, Schema } from 'mongoose';
import { IEducationalLevel } from './EducationalLevel';

export interface ICourse extends Document {
  title: string;
  educationalLevel: IEducationalLevel['_id']; // Changed to reference EducationalLevel
  term: 'first' | 'second';
  description?: string;
  order: number;
  // Legacy fields remain optional so existing records and compatibility routes can be read.
  shortDescription?: string;
  fullDescription?: string;
  price?: number;
  image?: string;
  vodafoneNumber?: string;
  month?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  educationalLevel: {
    type: Schema.Types.ObjectId,
    ref: 'EducationalLevel',
    required: true
  },
  term: {
    type: String,
    required: true,
    enum: ['first', 'second'],
    default: 'first'
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  shortDescription: {
    type: String,
    required: false,
    trim: true
  },
  fullDescription: {
    type: String,
    required: false,
    trim: true
  },
  price: {
    type: Number,
    required: false,
    min: 0
  },
  image: {
    type: String,
    required: false
  },
  vodafoneNumber: {
    type: String,
    required: false,
    trim: true
  },
  month: {
    type: Number,
    required: false,
    min: 1,
    max: 12
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CourseSchema.index({ educationalLevel: 1 });
CourseSchema.index({ educationalLevel: 1, term: 1, order: 1 });
CourseSchema.index({ month: 1 });
CourseSchema.index({ isActive: 1 });
CourseSchema.index({ createdAt: -1 });
CourseSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text' });

export default mongoose.model<ICourse>('Course', CourseSchema);
