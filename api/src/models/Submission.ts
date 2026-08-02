import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedOption: string; // ID of the selected option
}

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId; // Can be exam or assignment
  onModel: 'Exam' | 'Assignment';
  answers: IAnswer[];
  score: number;
  totalMarks: number;
  submittedAt: Date;
  isGraded: boolean;
  gradedAt: Date;
  gradedBy: mongoose.Types.ObjectId; // Admin/teacher who graded (if manually graded)
}

const SubmissionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  answers: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: {
      type: String,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  gradedAt: {
    type: Date,
    required: false
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SubmissionSchema.index({ userId: 1 });
SubmissionSchema.index({ examId: 1 });
SubmissionSchema.index({ onModel: 1 });
SubmissionSchema.index({ submittedAt: -1 });
SubmissionSchema.index({ isGraded: 1 });

export default mongoose.model<ISubmission>('Submission', SubmissionSchema);