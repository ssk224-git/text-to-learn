import mongoose from 'mongoose';

// A lesson starts as just a title. The first time someone opens it, the AI writes
// its content and `isEnriched` flips to true, so we never pay to generate it twice.
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    objectives: [{ type: String }],
    // Flexible blocks: heading | paragraph | code | video | mcq (see utils/validators.js)
    content: { type: [mongoose.Schema.Types.Mixed], default: [] },
    isEnriched: { type: Boolean, default: false },
    hinglish: { type: mongoose.Schema.Types.Mixed }, // cached { roman, devanagari } explanation
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    order: { type: Number, default: 0 },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);
