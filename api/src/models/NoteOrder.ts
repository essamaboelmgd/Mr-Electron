import mongoose, { Document, Schema } from 'mongoose';

export interface INoteOrder extends Document {
  noteId: string;
  userId: string;
  name: string;
  studentPhone: string;
  guardianPhone: string;
  address: string;
  paymentMethod: 'cash';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NoteOrderSchema: Schema = new Schema({
  noteId: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  studentPhone: {
    type: String,
    required: true,
    trim: true
  },
  guardianPhone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash'],
    default: 'cash'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'shipped', 'delivered'],
    default: 'pending'
  },
  orderedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NoteOrderSchema.index({ userId: 1 });
NoteOrderSchema.index({ status: 1 });
NoteOrderSchema.index({ createdAt: -1 });

export default mongoose.model<INoteOrder>('NoteOrder', NoteOrderSchema);