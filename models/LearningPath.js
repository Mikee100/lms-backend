const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Learning path title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'leadership',
      'technical',
      'soft-skills',
      'compliance',
      'onboarding',
      'product-training',
      'sales',
      'customer-service',
      'management',
      'certification'
    ]
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  estimatedDuration: {
    hours: {
      type: Number,
      default: 0
    },
    weeks: {
      type: Number,
      default: 0
    }
  },
  courses: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }]
  }],
  requirements: {
    skills: [String],
    experience: String,
    certifications: [String]
  },
  outcomes: {
    skills: [String],
    certifications: [String],
    competencies: [String]
  },
  assessment: {
    type: {
      type: String,
      enum: ['quiz', 'project', 'presentation', 'certification', 'none'],
      default: 'none'
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    maxAttempts: {
      type: Number,
      default: 3
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'organization'],
    default: 'organization'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  tags: [String],
  thumbnail: {
    filename: String,
    originalName: String,
    contentType: String,
    path: String,
    size: Number
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
learningPathSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for organization and category queries
learningPathSchema.index({ organization: 1, category: 1 });
learningPathSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema); 