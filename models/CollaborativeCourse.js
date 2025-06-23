const mongoose = require('mongoose');

const collaborativeCourseSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  collaborators: [{
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'reviewer', 'viewer'],
      default: 'editor'
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: true
      },
      canDelete: {
        type: Boolean,
        default: false
      },
      canPublish: {
        type: Boolean,
        default: false
      },
      canInvite: {
        type: Boolean,
        default: false
      },
      canViewAnalytics: {
        type: Boolean,
        default: true
      },
      canManageStudents: {
        type: Boolean,
        default: false
      }
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    joinedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'removed'],
      default: 'pending'
    }
  }],
  collaborationSettings: {
    requireApproval: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    conflictResolution: {
      type: String,
      enum: ['manual', 'automatic', 'last-writer-wins'],
      default: 'manual'
    },
    notificationPreferences: {
      onEdit: {
        type: Boolean,
        default: true
      },
      onPublish: {
        type: Boolean,
        default: true
      },
      onComment: {
        type: Boolean,
        default: true
      }
    }
  },
  activeEditors: [{
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor'
    },
    section: {
      type: mongoose.Schema.Types.ObjectId
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    entityType: {
      type: String,
      enum: ['course', 'section', 'lecture', 'material'],
      required: true
    },
    entityId: mongoose.Schema.Types.ObjectId,
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    isResolved: {
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
  }],
  changeHistory: [{
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'edited', 'deleted', 'published', 'commented'],
      required: true
    },
    entityType: {
      type: String,
      enum: ['course', 'section', 'lecture', 'material', 'comment'],
      required: true
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityTitle: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'archived'],
    default: 'active'
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
collaborativeCourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
collaborativeCourseSchema.index({ course: 1 });
collaborativeCourseSchema.index({ 'collaborators.tutor': 1 });
collaborativeCourseSchema.index({ 'collaborators.status': 1 });
collaborativeCourseSchema.index({ status: 1 });

module.exports = mongoose.model('CollaborativeCourse', collaborativeCourseSchema); 