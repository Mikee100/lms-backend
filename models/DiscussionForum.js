const mongoose = require('mongoose');

const discussionForumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'course_specific', 'study_tips', 'career_advice', 'technical', 'social', 'announcements']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  topics: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true,
      trim: true
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
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      trim: true
    }],
    views: {
      type: Number,
      default: 0
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    replies: [{
      content: {
        type: String,
        required: true,
        trim: true
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
      updatedAt: {
        type: Date,
        default: Date.now
      },
      isAccepted: {
        type: Boolean,
        default: false
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      editHistory: [{
        content: String,
        editedAt: Date,
        editedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student'
        }
      }],
      likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }],
      dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      }],
      replies: [{
        content: {
          type: String,
          required: true,
          trim: true
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
        }],
        dislikes: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Student'
        }]
      }]
    }],
    attachments: [{
      filename: {
        type: String,
        required: true
      },
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  stats: {
    totalTopics: {
      type: Number,
      default: 0
    },
    totalReplies: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  rules: [{
    title: {
      type: String,
      required: true
    },
    description: String
  }],
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxAttachments: {
      type: Number,
      default: 5
    },
    maxAttachmentSize: {
      type: Number,
      default: 10 // MB
    },
    allowedFileTypes: [{
      type: String
    }]
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
discussionForumSchema.index({ category: 1, status: 1 });
discussionForumSchema.index({ course: 1, status: 1 });
discussionForumSchema.index({ creator: 1 });
discussionForumSchema.index({ tags: 1 });
discussionForumSchema.index({ isPublic: 1, status: 1 });
discussionForumSchema.index({ 'topics.createdAt': -1 });
discussionForumSchema.index({ 'topics.author': 1 });

// Virtual for topic count
discussionForumSchema.virtual('topicCount').get(function() {
  return this.topics.length;
});

// Virtual for reply count
discussionForumSchema.virtual('replyCount').get(function() {
  return this.topics.reduce((total, topic) => {
    return total + topic.replies.length + topic.replies.reduce((replyTotal, reply) => {
      return replyTotal + reply.replies.length;
    }, 0);
  }, 0);
});

// Method to add a topic
discussionForumSchema.methods.addTopic = function(topicData) {
  this.topics.push(topicData);
  this.stats.totalTopics += 1;
  this.stats.lastActivity = new Date();
  return this.save();
};

// Method to add a reply to a topic
discussionForumSchema.methods.addReply = function(topicId, replyData) {
  const topic = this.topics.id(topicId);
  if (topic) {
    topic.replies.push(replyData);
    this.stats.totalReplies += 1;
    this.stats.lastActivity = new Date();
    return this.save();
  }
  throw new Error('Topic not found');
};

// Method to like/unlike a topic
discussionForumSchema.methods.toggleTopicLike = function(topicId, studentId) {
  const topic = this.topics.id(topicId);
  if (topic) {
    const likeIndex = topic.likes.indexOf(studentId);
    const dislikeIndex = topic.dislikes.indexOf(studentId);
    
    if (likeIndex > -1) {
      topic.likes.splice(likeIndex, 1);
    } else {
      topic.likes.push(studentId);
      if (dislikeIndex > -1) {
        topic.dislikes.splice(dislikeIndex, 1);
      }
    }
    
    return this.save();
  }
  throw new Error('Topic not found');
};

// Method to view a topic
discussionForumSchema.methods.viewTopic = function(topicId) {
  const topic = this.topics.id(topicId);
  if (topic) {
    topic.views += 1;
    this.stats.totalViews += 1;
    return this.save();
  }
  throw new Error('Topic not found');
};

// Method to pin/unpin a topic
discussionForumSchema.methods.toggleTopicPin = function(topicId) {
  const topic = this.topics.id(topicId);
  if (topic) {
    topic.isPinned = !topic.isPinned;
    return this.save();
  }
  throw new Error('Topic not found');
};

// Method to lock/unlock a topic
discussionForumSchema.methods.toggleTopicLock = function(topicId) {
  const topic = this.topics.id(topicId);
  if (topic) {
    topic.isLocked = !topic.isLocked;
    return this.save();
  }
  throw new Error('Topic not found');
};

// Static method to find forums by category
discussionForumSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, status: 'active' };
  
  if (options.includePrivate === false) {
    query.isPublic = true;
  }
  
  return this.find(query)
    .populate('creator', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ isPinned: -1, updatedAt: -1 });
};

// Static method to find forums by course
discussionForumSchema.statics.findByCourse = function(courseId) {
  return this.find({
    course: courseId,
    status: 'active'
  })
    .populate('creator', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ isPinned: -1, updatedAt: -1 });
};

// Static method to search forums
discussionForumSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    status: 'active',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.includePrivate === false) {
    query.isPublic = true;
  }
  
  return this.find(query)
    .populate('creator', 'firstName lastName avatar')
    .populate('course', 'title thumbnail')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('DiscussionForum', discussionForumSchema); 