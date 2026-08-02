import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: 'active' | 'pending' | 'rejected';
  subscribedAt: Date;
  paymentMethod: 'center' | 'vodafone' | 'code';
  vodafoneReceipt: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'pending', 'rejected'],
    default: 'pending'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: false,
    enum: ['center', 'vodafone', 'code']
  },
  vodafoneReceipt: {
    type: String,
    required: false
  },
  expiresAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ courseId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ paymentMethod: 1 });
SubscriptionSchema.index({ subscribedAt: -1 });
SubscriptionSchema.index({ expiresAt: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);