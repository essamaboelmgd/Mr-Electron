import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoWatchSession extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  sessionId: string;
  watchedSeconds: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  startedAt: Date;
  lastWatchedAt: Date;
  completedAt?: Date | null;
}

const VideoWatchSessionSchema = new Schema<IVideoWatchSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  sessionId: { type: String, required: true, trim: true, maxlength: 120 },
  watchedSeconds: { type: Number, min: 0, default: 0 },
  lastPositionSeconds: { type: Number, min: 0, default: 0 },
  durationSeconds: { type: Number, min: 0, default: 0 },
  startedAt: { type: Date, default: Date.now },
  lastWatchedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, required: false, default: null }
}, { timestamps: true });

VideoWatchSessionSchema.index({ userId: 1, lessonId: 1, sessionId: 1 }, { unique: true });
VideoWatchSessionSchema.index({ userId: 1, lastWatchedAt: -1 });

export default mongoose.model<IVideoWatchSession>('VideoWatchSession', VideoWatchSessionSchema);
