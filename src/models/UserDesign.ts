import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDesign extends Document {
  walletAddress: string;
  designId: string;
  name: string;
  canvasData: object;
  blobId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    canvasSize: { width: number; height: number };
    elementCount: number;
    lastModified: Date;
  };
}

const UserDesignSchema = new Schema<IUserDesign>({
  walletAddress: {
    type: String,
    required: true,
    index: true
  },
  designId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  canvasData: {
    type: Schema.Types.Mixed,
    required: true
  },
  blobId: {
    type: String,
    required: false
  },
  metadata: {
    canvasSize: {
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    },
    elementCount: { type: Number, required: true, default: 0 },
    lastModified: { type: Date, required: true, default: Date.now }
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'user_designs'
});

// Indexes for better performance
UserDesignSchema.index({ walletAddress: 1, createdAt: -1 });
UserDesignSchema.index({ updatedAt: -1 });

// Pre-save middleware to update metadata
UserDesignSchema.pre('save', function(next) {
  if (this.isModified('canvasData')) {
    const canvasData = this.canvasData as any;
    
    // Update canvas size
    this.metadata.canvasSize = {
      width: canvasData.width || 800,
      height: canvasData.height || 600
    };
    
    // Update element count
    this.metadata.elementCount = canvasData.objects ? canvasData.objects.length : 0;
    
    // Update last modified
    this.metadata.lastModified = new Date();
  }
  next();
});

// Export the model
export const UserDesign = mongoose.models.UserDesign || mongoose.model<IUserDesign>('UserDesign', UserDesignSchema);
