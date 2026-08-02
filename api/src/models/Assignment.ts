import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  courseId: mongoose.Types.ObjectId | null;
  lessonId: mongoose.Types.ObjectId | null;
  title: string;
  date: Date;
  timeLimitMin: number;
  totalMarks: number;
  type: 'course' | 'general';
  isActive: boolean;
  mandatoryAttendance: boolean; // New field to indicate if attendance is mandatory
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: false
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: false // Made optional
  },
  timeLimitMin: {
    type: Number,
    required: false, // Made optional
    min: 0,
    default: 0
  },
  totalMarks: {
    type: Number,
    required: false, // Made optional
    min: 0,
    default: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['course', 'general']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mandatoryAttendance: {
    type: Boolean,
    default: false // By default, attendance is not mandatory
  }
}, {
  timestamps: true
});

// Indexes for better query performance
AssignmentSchema.index({ courseId: 1 });
AssignmentSchema.index({ lessonId: 1 });
AssignmentSchema.index({ type: 1 });
AssignmentSchema.index({ isActive: 1 });
AssignmentSchema.index({ date: -1 });
AssignmentSchema.index({ createdAt: -1 });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);