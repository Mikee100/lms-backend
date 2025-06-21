const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  duration: {
    type: Number, // in weeks
    default: 8
  },
  goals: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    targetDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  sessions: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    scheduledAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number, // in minutes
      default: 60
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled'
    },
    meetingLink: String,
    notes: String,
    topics: [String],
    resources: [{
      title: String,
      url: String,
      type: String
    }],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      from: {
        type: String,
        enum: ['mentor', 'mentee']
      }
    }
  }],
  communication: {
    preferredMethod: {
      type: String,
      enum: ['video_call', 'voice_call', 'chat', 'email'],
      default: 'video_call'
    },
    availability: {
      weekdays: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        },
        timeSlots: [{
          start: String,
          end: String
        }]
      }],
      weekends: [{
        day: {
          type: String,
          enum: ['saturday', 'sunday']
        },
        timeSlots: [{
          start: String,
          end: String
        }]
      }]
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  progress: {
    currentWeek: {
      type: Number,
      default: 1
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 0
    },
    satisfactionScore: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  skills: {
    mentorSkills: [{
      skill: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    }],
    menteeGoals: [{
      skill: String,
      currentLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
      },
      targetLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    }]
  },
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'exercise', 'quiz']
    },
    url: String,
    description: String,
    sharedBy: {
      type: String,
      enum: ['mentor', 'mentee']
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  feedback: {
    mentorFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    },
    menteeFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      submittedAt: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ mentee: 1, status: 1 });
mentorshipSchema.index({ course: 1, status: 1 });
mentorshipSchema.index({ status: 1, startDate: -1 });

// Virtual for session completion rate
mentorshipSchema.virtual('sessionCompletionRate').get(function() {
  if (this.progress.totalSessions === 0) return 0;
  return (this.progress.completedSessions / this.progress.totalSessions) * 100;
});

// Virtual for mentorship duration
mentorshipSchema.virtual('durationInWeeks').get(function() {
  if (!this.startDate) return 0;
  const end = this.endDate || new Date();
  const diffTime = Math.abs(end - this.startDate);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
});

// Method to add a session
mentorshipSchema.methods.addSession = function(sessionData) {
  this.sessions.push(sessionData);
  this.progress.totalSessions += 1;
  return this.save();
};

// Method to complete a session
mentorshipSchema.methods.completeSession = function(sessionId, feedback = {}) {
  const session = this.sessions.id(sessionId);
  if (session) {
    session.status = 'completed';
    session.feedback = feedback;
    this.progress.completedSessions += 1;
    this.progress.attendanceRate = (this.progress.completedSessions / this.progress.totalSessions) * 100;
    return this.save();
  }
  throw new Error('Session not found');
};

// Method to add a goal
mentorshipSchema.methods.addGoal = function(goalData) {
  this.goals.push(goalData);
  return this.save();
};

// Method to complete a goal
mentorshipSchema.methods.completeGoal = function(goalId) {
  const goal = this.goals.id(goalId);
  if (goal) {
    goal.completed = true;
    goal.completedAt = new Date();
    return this.save();
  }
  throw new Error('Goal not found');
};

// Method to add a message
mentorshipSchema.methods.addMessage = function(senderId, content) {
  this.messages.push({
    sender: senderId,
    content,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find active mentorships for a student
mentorshipSchema.statics.findActiveByStudent = function(studentId) {
  return this.find({
    $or: [{ mentor: studentId }, { mentee: studentId }],
    status: 'active'
  })
    .populate('mentor', 'firstName lastName avatar')
    .populate('mentee', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ updatedAt: -1 });
};

// Static method to find available mentors for a course
mentorshipSchema.statics.findAvailableMentors = function(courseId) {
  return this.aggregate([
    {
      $match: {
        course: mongoose.Types.ObjectId(courseId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$mentor',
        totalMentees: { $sum: 1 },
        avgRating: { $avg: '$feedback.menteeFeedback.rating' }
      }
    },
    {
      $match: {
        totalMentees: { $lt: 5 } // Limit to mentors with less than 5 mentees
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'mentorInfo'
      }
    },
    {
      $unwind: '$mentorInfo'
    },
    {
      $project: {
        mentor: '$mentorInfo',
        totalMentees: 1,
        avgRating: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Mentorship', mentorshipSchema); 