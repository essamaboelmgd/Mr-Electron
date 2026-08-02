import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoProgress extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  sessionCount: number;
  watchedSeconds: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  completionPercent: number;
  lastWatchedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VideoProgressSchema = new Schema<IVideoProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  sessionCount: { type: Number, min: 0, default: 0 },
  watchedSeconds: { type: Number, min: 0, default: 0 },
  lastPositionSeconds: { type: Number, min: 0, default: 0 },
  durationSeconds: { type: Number, min: 0, default: 0 },
  completionPercent: { type: Number, min: 0, max: 100, default: 0 },
  lastWatchedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, required: false, default: null }
}, { timestamps: true });

VideoProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
VideoProgressSchema.index({ userId: 1, lastWatchedAt: -1 });
VideoProgressSchema.index({ lessonId: 1, completionPercent: 1 });

export default mongoose.model<IVideoProgress>('VideoProgress', VideoProgressSchema);
