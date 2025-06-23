const mongoose = require('mongoose');

const contentSchedulerSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Schedule title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  scheduleType: {
    type: String,
    enum: ['manual', 'automatic', 'conditional'],
    default: 'manual'
  },
  releaseStrategy: {
    type: String,
    enum: ['all-at-once', 'weekly', 'bi-weekly', 'monthly', 'custom'],
    default: 'weekly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  items: [{
    content: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'items.contentModel',
      required: true
    },
    contentModel: {
      type: String,
      enum: ['Section', 'Lecture', 'Assignment'],
      required: true
    },
    title: String,
    description: String,
    scheduledDate: {
      type: Date,
      required: true
    },
    releaseTime: {
      type: String,
      default: '09:00' // Default to 9 AM
    },
    isReleased: {
      type: Boolean,
      default: false
    },
    releaseConditions: {
      prerequisites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
      }],
      minimumProgress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      requiredAssessments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment'
      }]
    },
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        template: String
      },
      inApp: {
        enabled: {
          type: Boolean,
          default: true
        },
        message: String
      }
    }
  }],
  settings: {
    autoRelease: {
      type: Boolean,
      default: false
    },
    allowEarlyAccess: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    reminderNotifications: {
      enabled: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'never'],
        default: 'weekly'
      }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
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
contentSchedulerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
contentSchedulerSchema.index({ course: 1, status: 1 });
contentSchedulerSchema.index({ 'items.scheduledDate': 1 });
contentSchedulerSchema.index({ createdBy: 1 });

module.exports = mongoose.model('ContentScheduler', contentSchedulerSchema); 