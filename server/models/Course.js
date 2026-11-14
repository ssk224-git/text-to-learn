import mongoose from 'mongoose';

// Course 1 ──< many Modules (stored as an ordered list of ids)
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    topic: { type: String, required: true }, // what the user typed
    creator: { type: String, required: true, index: true }, // Auth0 `sub`
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    tags: [{ type: String, trim: true }],
    meta: { type: mongoose.Schema.Types.Mixed }, // model, tokens, time taken
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
