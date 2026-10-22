import mongoose, { Document, Schema } from 'mongoose';

export type CommentStatus = 'visible' | 'hidden' | 'deleted';

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['visible', 'hidden', 'deleted'],
      default: 'visible',
      index: true
    }
  },
  {
    timestamps: true
  }
);

commentSchema.index({ post: 1, status: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);
