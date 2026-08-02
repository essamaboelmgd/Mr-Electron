import mongoose, { Document, Schema } from 'mongoose';

export interface ILessonAccess extends Document {
  userId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonAccessSchema = new Schema<ILessonAccess>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  enabled: { type: Boolean, default: false }
}, { timestamps: true });

LessonAccessSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model<ILessonAccess>('LessonAccess', LessonAccessSchema);
