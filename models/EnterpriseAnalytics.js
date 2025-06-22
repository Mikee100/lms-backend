const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  metrics: {
    // User Engagement
    totalUsers: {
      type: Number,
      default: 0
    },
    activeUsers: {
      daily: { type: Number, default: 0 },
      weekly: { type: Number, default: 0 },
      monthly: { type: Number, default: 0 }
    },
    newUsers: {
      type: Number,
      default: 0
    },
    churnRate: {
      type: Number,
      default: 0
    },
    
    // Course Performance
    totalCourses: {
      type: Number,
      default: 0
    },
    completedCourses: {
      type: Number,
      default: 0
    },
    averageCompletionRate: {
      type: Number,
      default: 0
    },
    averageCourseRating: {
      type: Number,
      default: 0
    },
    
    // Learning Path Performance
    totalLearningPaths: {
      type: Number,
      default: 0
    },
    activeLearningPaths: {
      type: Number,
      default: 0
    },
    learningPathCompletions: {
      type: Number,
      default: 0
    },
    
    // Time and Engagement
    totalLearningHours: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    averageTimeToComplete: {
      type: Number,
      default: 0
    },
    
    // Assessment Performance
    totalAssessments: {
      type: Number,
      default: 0
    },
    averageAssessmentScore: {
      type: Number,
      default: 0
    },
    passRate: {
      type: Number,
      default: 0
    },
    
    // Department/Team Metrics
    departmentMetrics: [{
      department: String,
      userCount: Number,
      completionRate: Number,
      averageScore: Number,
      totalHours: Number
    }],
    
    // Skill Development
    skillGaps: [{
      skill: String,
      currentLevel: Number,
      targetLevel: Number,
      gap: Number
    }],
    
    // ROI Metrics
    trainingCost: {
      type: Number,
      default: 0
    },
    productivityImprovement: {
      type: Number,
      default: 0
    },
    retentionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Detailed breakdowns
  breakdowns: {
    byCategory: [{
      category: String,
      enrollments: Number,
      completions: Number,
      averageScore: Number,
      averageTime: Number
    }],
    byLevel: [{
      level: String,
      enrollments: Number,
      completions: Number,
      averageScore: Number
    }],
    byInstructor: [{
      instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor'
      },
      courses: Number,
      students: Number,
      averageRating: Number,
      completionRate: Number
    }],
    byTimePeriod: [{
      period: String, // daily, weekly, monthly
      date: Date,
      enrollments: Number,
      completions: Number,
      activeUsers: Number
    }]
  },
  
  // Custom KPIs
  customKPIs: [{
    name: String,
    value: Number,
    target: Number,
    unit: String,
    trend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable']
    }
  }],
  
  // Alerts and Notifications
  alerts: [{
    type: {
      type: String,
      enum: ['low-engagement', 'high-churn', 'low-completion', 'skill-gap', 'budget-exceeded']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    message: String,
    triggeredAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
analyticsSchema.index({ organization: 1, date: -1 });
analyticsSchema.index({ organization: 1, 'metrics.totalUsers': -1 });

// Compound index for date range queries
analyticsSchema.index({ organization: 1, date: 1 });

module.exports = mongoose.model('EnterpriseAnalytics', analyticsSchema); 