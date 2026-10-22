import mongoose, { Document, Schema } from 'mongoose';

export interface IPollVote extends Document {
  pollPost: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  optionId: string;
  createdAt: Date;
}

const pollVoteSchema = new Schema<IPollVote>(
  {
    pollPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    optionId: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Unique compound index guarantees strictly 1 vote per user per poll
pollVoteSchema.index({ pollPost: 1, user: 1 }, { unique: true });

export const PollVote = mongoose.model<IPollVote>('PollVote', pollVoteSchema);
