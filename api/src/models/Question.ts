import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  examId: mongoose.Types.ObjectId; // Can be for exam or assignment
  onModel: 'Exam' | 'Assignment'; // Added onModel field
  type: 'text' | 'image';
  content: string; // For text questions, this is the question text. For image questions, this is the image URL
  options: IOption[];
  correct: string; // ID of the correct option
  explanation: string;
  order: number;
  // Added marks field
  marks: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  examId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Exam', 'Assignment']
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image']
  },
  content: {
    type: String,
    required: true
  },
  options: [{
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  }],
  correct: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: false
  },
  order: {
    type: Number,
    required: true
  },
  // Added marks field
  marks: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for better query performance
QuestionSchema.index({ examId: 1 });
QuestionSchema.index({ onModel: 1 });
QuestionSchema.index({ type: 1 });
QuestionSchema.index({ order: 1 });
QuestionSchema.index({ createdAt: -1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);