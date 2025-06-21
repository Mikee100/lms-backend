const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  members: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'leader'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    }
  }],
  maxMembers: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  meetingSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'],
      default: 'weekly'
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    time: {
      type: String,
      pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'note'],
      required: true
    },
    url: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  discussions: [{
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    replies: [{
      content: {
        type: String,
        required: true
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }]
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    tags: [String]
  }],
  activities: [{
    type: {
      type: String,
      enum: ['meeting', 'assignment', 'quiz', 'discussion', 'resource_share'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    scheduledAt: Date,
    completedAt: Date,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }]
  }],
  stats: {
    totalMeetings: {
      type: Number,
      default: 0
    },
    totalDiscussions: {
      type: Number,
      default: 0
    },
    totalResources: {
      type: Number,
      default: 0
    },
    averageParticipation: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studyGroupSchema.index({ course: 1, status: 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ 'members.student': 1 });
studyGroupSchema.index({ tags: 1 });
studyGroupSchema.index({ isPrivate: 1, status: 1 });

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Method to check if user is a member
studyGroupSchema.methods.isMember = function(studentId) {
  return this.members.some(member => 
    member.student.toString() === studentId.toString() && 
    member.status === 'active'
  );
};

// Method to check if user can join
studyGroupSchema.methods.canJoin = function(studentId) {
  if (this.isMember(studentId)) return false;
  if (this.memberCount >= this.maxMembers) return false;
  return true;
};

// Method to add member
studyGroupSchema.methods.addMember = function(studentId, role = 'member') {
  if (!this.canJoin(studentId)) {
    throw new Error('Cannot add member to group');
  }
  
  this.members.push({
    student: studentId,
    role,
    joinedAt: new Date(),
    status: 'active'
  });
  
  return this.save();
};

// Method to remove member
studyGroupSchema.methods.removeMember = function(studentId) {
  const memberIndex = this.members.findIndex(member => 
    member.student.toString() === studentId.toString()
  );
  
  if (memberIndex > -1) {
    this.members.splice(memberIndex, 1);
    return this.save();
  }
  
  throw new Error('Member not found in group');
};

// Static method to find groups by course
studyGroupSchema.statics.findByCourse = function(courseId, options = {}) {
  const query = { course: courseId, status: 'active' };
  
  if (options.includePrivate === false) {
    query.isPrivate = false;
  }
  
  return this.find(query)
    .populate('creator', 'firstName lastName avatar')
    .populate('members.student', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });
};

// Static method to find groups by student
studyGroupSchema.statics.findByStudent = function(studentId) {
  return this.find({
    'members.student': studentId,
    'members.status': 'active',
    status: 'active'
  })
    .populate('creator', 'firstName lastName avatar')
    .populate('members.student', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('StudyGroup', studyGroupSchema); 