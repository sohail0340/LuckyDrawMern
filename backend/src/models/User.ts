import { Schema, model, Types } from "mongoose";

export interface IUser {
  phone?: string;
  email?: string;
  name?: string;
  passwordHash: string;
  tokens: number;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  city?: string;
  address?: string;
  province?: string;
  cnic?: string;
  lastSpinDate?: Date;
  lastLogin?: Date;
  isAdmin: boolean;
  suspended: boolean;
  referralForceEnabled: boolean;
  spinForceEnabled: boolean;
  isWinner: boolean;
  wonDrawId?: Types.ObjectId;
  wonAt?: Date;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, sparse: true, unique: true },
    email: { type: String, sparse: true, unique: true },
    name: { type: String },
    passwordHash: { type: String, required: true },
    tokens: { type: Number, default: 0 },
    referralCode: { type: String, sparse: true, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    city: { type: String },
    address: { type: String },
    province: { type: String },
    cnic: { type: String },
    lastSpinDate: { type: Date },
    lastLogin: { type: Date },
    isAdmin: { type: Boolean, default: false },
    suspended: { type: Boolean, default: false },
    referralForceEnabled: { type: Boolean, default: false },
    spinForceEnabled: { type: Boolean, default: false },
    isWinner: { type: Boolean, default: false },
    wonDrawId: { type: Schema.Types.ObjectId, ref: "Draw" },
    wonAt: { type: Date },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false, collection: "cld_users" }
);

// Indexes
UserSchema.index({ createdAt: -1 });
UserSchema.index({ suspended: 1 });

export const User = model<IUser>("User", UserSchema);