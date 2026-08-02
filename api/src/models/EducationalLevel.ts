import mongoose, { Document, Schema } from 'mongoose';

export interface IEducationalLevel extends Document {
  name: string;
  nameAr: string;
  level: 'primary' | 'prep';
  year: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const EducationalLevelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  nameAr: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  level: {
    type: String,
    required: true,
    enum: ['primary', 'prep']
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
EducationalLevelSchema.index({ level: 1 });
EducationalLevelSchema.index({ year: 1 });
EducationalLevelSchema.index({ isActive: 1 });
EducationalLevelSchema.index({ order: 1 });

export default mongoose.model<IEducationalLevel>('EducationalLevel', EducationalLevelSchema);
