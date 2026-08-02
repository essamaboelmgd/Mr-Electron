import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseAccess extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseAccessSchema = new Schema<ICourseAccess>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  enabled: { type: Boolean, default: false }
}, { timestamps: true });

CourseAccessSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseAccessSchema.index({ courseId: 1, enabled: 1 });

export default mongoose.model<ICourseAccess>('CourseAccess', CourseAccessSchema);
