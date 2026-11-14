import mongoose from 'mongoose';

// A person who logged in with Auth0. `sub` is Auth0's unique id for them.
const userSchema = new mongoose.Schema(
  {
    sub: { type: String, required: true, unique: true },
    email: String,
    name: String,
    picture: String,
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
