import mongoose, { Document, Schema } from 'mongoose';
import { IEducationalLevel } from './EducationalLevel';
import { ICourse } from './Course';

export interface INote extends Document {
  title: string;
  educationalLevel: IEducationalLevel['_id']; // Changed from year to educationalLevel
  courseId: ICourse['_id']; // Added courseId field
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema({
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
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: false // Make it optional
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NoteSchema.index({ educationalLevel: 1 });
NoteSchema.index({ courseId: 1 }); // Added index for courseId
NoteSchema.index({ isActive: 1 });
NoteSchema.index({ createdAt: -1 });
NoteSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<INote>('Note', NoteSchema);