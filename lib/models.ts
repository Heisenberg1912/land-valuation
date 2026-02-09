import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const UsageSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // user email OR device id
    freeUsed: { type: Number, required: true, default: 0 },
    paid: { type: Boolean, required: true, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const SessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ["user", "associate", "vendor", "buyer", "admin", "superadmin"],
      default: "user",
    },
    isVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "expired"],
        default: "active",
      },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        if (ret.__v !== undefined) delete ret.__v;
        return ret;
      },
    },
  }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const Usage = mongoose.models.Usage ?? mongoose.model("Usage", UsageSchema);
export const Session = mongoose.models.Session ?? mongoose.model("Session", SessionSchema);
export const User = mongoose.models.User ?? mongoose.model("User", UserSchema);
