import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },

    MobileNumber: { 
      type: String, 
      required: true, 
      unique: true,
      match: [/^[0-9]{10}$/, "Mobile number must be 10 digits"]
    },

    password: { type: String, required: true, minlength: 6 },

    role: { 
      type: String, 
      enum: ["customer", "assistant", "admin"], 
      default: "customer",
      required: true 
    },

    age: { type: Number, required: true, min: 1 },

    // Profile image URL
    profilePhoto: { 
      type: String,
      default: "default-profile.png"
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
