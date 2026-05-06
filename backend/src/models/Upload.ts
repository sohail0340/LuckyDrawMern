import { Schema, model, Types } from "mongoose";

export interface IUpload {
  filename: string;
  url: string;
  fileSizeBytes: number;
  type?: "screenshot" | "draw_image" | "other";
  uploadedById?: Types.ObjectId;
  createdAt: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    filename: { type: String, unique: true, required: true },
    url: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["screenshot", "draw_image", "other"],
      default: "other",
    },
    uploadedById: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_uploads" }
);

// Indexes
UploadSchema.index({ type: 1 });
UploadSchema.index({ createdAt: -1 });

export const Upload = model<IUpload>("Upload", UploadSchema);