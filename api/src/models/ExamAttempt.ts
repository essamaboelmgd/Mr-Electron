import mongoose, { Document, Schema } from 'mongoose';

export interface IAttemptAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string;
}

export interface IExamAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  attemptNumber: number;
  status: 'in_progress' | 'submitted' | 'expired';
  answers: IAttemptAnswer[];
  currentQuestion: number;
  startedAt: Date;
  expiresAt?: Date | null;
  submittedAt?: Date | null;
  submittedReason?: 'manual' | 'timeout';
  score?: number;
  totalMarks?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamAttemptSchema = new Schema<IExamAttempt>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  attemptNumber: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'expired'],
    default: 'in_progress'
  },
  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, required: true }
  }],
  currentQuestion: { type: Number, min: 0, default: 0 },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: false, default: null },
  submittedAt: { type: Date, required: false, default: null },
  submittedReason: { type: String, enum: ['manual', 'timeout'], required: false },
  score: { type: Number, min: 0, required: false },
  totalMarks: { type: Number, min: 0, required: false }
}, { timestamps: true });

ExamAttemptSchema.index({ userId: 1, examId: 1, status: 1 });
ExamAttemptSchema.index({ userId: 1, examId: 1, attemptNumber: 1 }, { unique: true });
ExamAttemptSchema.index({ examId: 1, submittedAt: -1 });

export default mongoose.model<IExamAttempt>('ExamAttempt', ExamAttemptSchema);
