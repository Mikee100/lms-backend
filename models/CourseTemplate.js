const mongoose = require('mongoose');

const courseTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: [
      'Computer Science',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Business',
      'Economics',
      'Psychology',
      'History',
      'Literature',
      'Languages',
      'Art',
      'Music',
      'Engineering',
      'Medicine',
      'Law',
      'Education',
      'Marketing',
      'Finance',
      'Other'
    ]
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
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
  structure: {
    sections: [{
      title: String,
      description: String,
      order: Number,
      estimatedDuration: {
        hours: Number,
        minutes: Number
      },
      lectures: [{
        title: String,
        description: String,
        order: Number,
        type: {
          type: String,
          enum: ['video', 'reading', 'quiz', 'assignment', 'discussion'],
          default: 'video'
        },
        estimatedDuration: Number, // in minutes
        materials: [{
          type: String,
          name: String,
          description: String,
          required: Boolean
        }]
      }],
      assessments: [{
        title: String,
        type: {
          type: String,
          enum: ['quiz', 'assignment', 'project', 'presentation'],
          default: 'quiz'
        },
        weight: {
          type: Number,
          min: 0,
          max: 100,
          default: 10
        },
        instructions: String
      }]
    }]
  },
  learningObjectives: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  outcomes: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
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
  isPublic: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
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

// Update timestamps
courseTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
courseTemplateSchema.index({ subject: 1, level: 1 });
courseTemplateSchema.index({ isPublic: 1, status: 1 });
courseTemplateSchema.index({ createdBy: 1 });

module.exports = mongoose.model('CourseTemplate', courseTemplateSchema); 