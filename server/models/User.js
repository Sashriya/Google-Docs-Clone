import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    profilePic: {
      type: String,
      default: "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;