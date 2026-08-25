import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  eventType: string;
  accountId: number;
  withdrawalId?: number;
  amount?: number;
  status: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    accountId: {
      type: Number,
      required: true,
      index: true,
    },
    withdrawalId: {
      type: Number,
      index: true,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
