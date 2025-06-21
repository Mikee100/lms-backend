const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendationSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reason: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['skill_gap', 'interest_match', 'popular', 'trending', 'completion_based', 'collaborative'],
    required: true
  },
  factors: {
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    interests: [String],
    completionRate: { type: Number, min: 0, max: 100 },
    averageRating: { type: Number, min: 0, max: 5 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    estimatedDuration: { type: Number }, // in hours
    prerequisites: [String],
    tags: [String]
  },
  metadata: {
    algorithm: { type: String, default: 'hybrid' },
    confidence: { type: Number, min: 0, max: 1 },
    lastUpdated: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    enrollCount: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
recommendationSchema.index({ student: 1, score: -1 });
recommendationSchema.index({ student: 1, category: 1 });
recommendationSchema.index({ course: 1, score: -1 });
recommendationSchema.index({ 'metadata.lastUpdated': -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema); 