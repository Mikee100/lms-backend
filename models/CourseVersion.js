const mongoose = require('mongoose');

const courseVersionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  versionNumber: {
    type: String,
    required: true
  },
  versionName: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Version name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  changes: [{
    type: {
      type: String,
      enum: ['added', 'modified', 'deleted', 'reordered'],
      required: true
    },
    entityType: {
      type: String,
      enum: ['section', 'lecture', 'material', 'assessment'],
      required: true
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityTitle: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  courseData: {
    // Snapshot of the entire course at this version
    title: String,
    description: String,
    subjects: [String],
    level: String,
    price: Number,
    isFree: Boolean,
    sections: [{
      title: String,
      description: String,
      order: Number,
      isLocked: Boolean,
      price: Number,
      isFree: Boolean,
      lectures: [{
        title: String,
        description: String,
        videoUrl: String,
        materials: [{
          filename: String,
          originalName: String,
          contentType: String,
          path: String,
          size: Number,
          uploadedAt: Date
        }],
        createdAt: Date,
        updatedAt: Date
      }],
      createdAt: Date,
      updatedAt: Date
    }],
    thumbnail: {
      filename: String,
      originalName: String,
      contentType: String,
      path: String,
      size: Number
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor'
  },
  approvalDate: Date,
  approvalNotes: String,
  tags: [{
    type: String,
    trim: true
  }],
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
courseVersionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
courseVersionSchema.index({ course: 1, versionNumber: 1 });
courseVersionSchema.index({ course: 1, isActive: 1 });
courseVersionSchema.index({ createdBy: 1 });
courseVersionSchema.index({ status: 1 });

// Compound index for version management
courseVersionSchema.index({ course: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CourseVersion', courseVersionSchema); 