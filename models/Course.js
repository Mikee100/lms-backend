const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  filename: String,       // Stored filename (on disk)
  originalName: String,   // Original filename from user
  contentType: String,
  path: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const lectureSchema = new mongoose.Schema({
  title: String,
  description: String,
  videoUrl: String,
  materials: [materialSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const sectionSchema = new mongoose.Schema({
  title: String,
  description: String,
  materials: [materialSchema],
  lectures: [lectureSchema],
  isLocked: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isFree: {
    type: Boolean,
    default: false
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

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subjects: {
  type: [String],
  default: []
},
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    filename: String,
    originalName: String,
    contentType: String,
    path: String,
    size: Number
  },
  sections: [sectionSchema],
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  // Enterprise Features
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  learningPaths: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath'
  }],
  // Corporate Training Features
  compliance: {
    isComplianceCourse: {
      type: Boolean,
      default: false
    },
    complianceType: {
      type: String,
      enum: ['safety', 'security', 'hr', 'legal', 'industry', 'none'],
      default: 'none'
    },
    expiryPeriod: {
      type: Number, // in months
      default: 12
    },
    requiredForRoles: [String],
    requiredForDepartments: [String]
  },
  assessment: {
    hasAssessment: {
      type: Boolean,
      default: false
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
    },
    certificateOnCompletion: {
      type: Boolean,
      default: false
    }
  },
  skills: [{
    name: String,
    level: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Visibility and Access Control
  visibility: {
    type: String,
    enum: ['public', 'private', 'organization', 'department'],
    default: 'public'
  },
  allowedDepartments: [String],
  allowedRoles: [String],
  // Metadata
  tags: [String],
  estimatedDuration: {
    hours: {
      type: Number,
      default: 0
    },
    minutes: {
      type: Number,
      default: 0
    }
  },
  language: {
    type: String,
    default: 'English'
  },
  version: {
    type: String,
    default: '1.0'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
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

// Update timestamps on save
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update section timestamps when modified
sectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update lecture timestamps when modified
lectureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for enterprise queries
courseSchema.index({ organization: 1, status: 1 });
courseSchema.index({ organization: 1, 'compliance.isComplianceCourse': 1 });
courseSchema.index({ learningPaths: 1 });

module.exports = mongoose.model('Course', courseSchema);