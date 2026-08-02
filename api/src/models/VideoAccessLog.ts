import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoAccessLog extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  accessedAt: Date;
  expiresAt: Date;
}

const VideoAccessLogSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  accessedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
VideoAccessLogSchema.index({ userId: 1, lessonId: 1 });
VideoAccessLogSchema.index({ expiresAt: 1 });

export default mongoose.model<IVideoAccessLog>('VideoAccessLog', VideoAccessLogSchema);