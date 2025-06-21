const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentGamificationSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  statistics: {
    // Learning Statistics
    lecturesCompleted: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    assignmentsSubmitted: { type: Number, default: 0 },
    perfectScores: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    
    // Time-based Statistics
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    averageSessionLength: { type: Number, default: 0 },
    longestSession: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    lastSessionDate: { type: Date },
    
    // Social Statistics
    socialInteractions: { type: Number, default: 0 },
    discussionsParticipated: { type: Number, default: 0 },
    peerReviewsGiven: { type: Number, default: 0 },
    peerReviewsReceived: { type: Number, default: 0 },
    helpRequestsAnswered: { type: Number, default: 0 },
    helpRequestsAsked: { type: Number, default: 0 },
    mentorSessions: { type: Number, default: 0 },
    menteeSessions: { type: Number, default: 0 },
    
    // Engagement Statistics
    materialsDownloaded: { type: Number, default: 0 },
    bookmarksCreated: { type: Number, default: 0 },
    notesTaken: { type: Number, default: 0 },
    questionsAsked: { type: Number, default: 0 },
    answersProvided: { type: Number, default: 0 },
    
    // Consistency Statistics
    daysActive: { type: Number, default: 0 },
    weeksActive: { type: Number, default: 0 },
    monthsActive: { type: Number, default: 0 },
    consecutiveWeeks: { type: Number, default: 0 },
    consecutiveMonths: { type: Number, default: 0 },
    
    // Performance Statistics
    coursesStarted: { type: Number, default: 0 },
    coursesAbandoned: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageCourseRating: { type: Number, default: 0 },
    totalRatingsGiven: { type: Number, default: 0 },
    
    // Special Statistics
    earlyBirdSessions: { type: Number, default: 0 }, // before 8 AM
    nightOwlSessions: { type: Number, default: 0 }, // after 10 PM
    weekendSessions: { type: Number, default: 0 },
    holidaySessions: { type: Number, default: 0 },
    
    // Advanced Statistics
    speedLearningSessions: { type: Number, default: 0 }, // completed quickly
    deepLearningSessions: { type: Number, default: 0 }, // long sessions
    mobileSessions: { type: Number, default: 0 },
    desktopSessions: { type: Number, default: 0 },
    
    // Community Statistics
    communityContributions: { type: Number, default: 0 },
    knowledgeShares: { type: Number, default: 0 },
    courseRecommendations: { type: Number, default: 0 },
    feedbackProvided: { type: Number, default: 0 }
  },
  streaks: {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    weeklyStreak: { type: Number, default: 0 },
    monthlyStreak: { type: Number, default: 0 },
    perfectWeekStreaks: { type: Number, default: 0 }, // 7 days in a week
    perfectMonthStreaks: { type: Number, default: 0 } // 30 days in a month
  },
  achievements: [{
    achievement: {
      type: Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 1
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    }
  }],
  leaderboardStats: {
    totalPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    totalRank: { type: Number },
    weeklyRank: { type: Number },
    monthlyRank: { type: Number },
    lastUpdated: { type: Date, default: Date.now }
  },
  preferences: {
    showLeaderboard: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    privacyLevel: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  },
  badges: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now },
    level: { type: Number, default: 1 },
    progress: { type: Number, default: 0 }
  }],
  challenges: [{
    challengeId: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    reward: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  milestones: [{
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    achievedAt: { type: Date, default: Date.now },
    value: { type: Number },
    metadata: { type: Map, of: Schema.Types.Mixed }
  }],
  activityLog: [{
    type: { type: String, required: true },
    description: { type: String },
    points: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Map, of: Schema.Types.Mixed }
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

// Indexes for better performance
studentGamificationSchema.index({ student: 1 });
studentGamificationSchema.index({ 'leaderboardStats.totalPoints': -1 });
studentGamificationSchema.index({ 'leaderboardStats.weeklyPoints': -1 });
studentGamificationSchema.index({ 'leaderboardStats.monthlyPoints': -1 });
studentGamificationSchema.index({ level: -1 });
studentGamificationSchema.index({ 'streaks.currentStreak': -1 });

// Add points and return new total
studentGamificationSchema.methods.addPoints = function(points) {
  this.points += points;
  this.totalPointsEarned += points;
  return this.points;
};

// Add experience and return new level
studentGamificationSchema.methods.addExperience = function(experience) {
  this.experience += experience;
  
  // Calculate new level (every 100 XP = 1 level)
  const newLevel = Math.floor(this.experience / 100) + 1;
  const levelUp = newLevel > this.level;
  
  if (levelUp) {
    this.level = newLevel;
  }
  
  return levelUp ? { newLevel, oldLevel: this.level - 1 } : null;
};

// Check if achievement is earned
studentGamificationSchema.methods.checkAchievement = function(achievement) {
  const existingAchievement = this.achievements.find(a => 
    a.achievement.toString() === achievement._id.toString()
  );
  
  if (existingAchievement && !achievement.isRepeatable) {
    return false; // Already earned and not repeatable
  }
  
  // Check if criteria is met based on achievement type
  let isEarned = false;
  let currentValue = 0;
  
  switch (achievement.criteria.type) {
    case 'lectures_completed':
      currentValue = this.statistics.lecturesCompleted;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'courses_completed':
      currentValue = this.statistics.coursesCompleted;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'streak_days':
      currentValue = this.streaks.currentStreak;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'points_earned':
      currentValue = this.totalPointsEarned;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'assignments_submitted':
      currentValue = this.statistics.assignmentsSubmitted;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'perfect_scores':
      currentValue = this.statistics.perfectScores;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'social_interactions':
      currentValue = this.statistics.socialInteractions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'time_spent_learning':
      currentValue = this.statistics.totalTimeSpent;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'materials_downloaded':
      currentValue = this.statistics.materialsDownloaded;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'discussions_participated':
      currentValue = this.statistics.discussionsParticipated;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'peer_reviews':
      currentValue = this.statistics.peerReviewsGiven + this.statistics.peerReviewsReceived;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'help_others':
      currentValue = this.statistics.helpRequestsAnswered;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'early_bird':
      currentValue = this.statistics.earlyBirdSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'night_owl':
      currentValue = this.statistics.nightOwlSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'weekend_warrior':
      currentValue = this.statistics.weekendSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'speed_learner':
      currentValue = this.statistics.speedLearningSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'accuracy_master':
      currentValue = this.statistics.averageScore;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'consistency_champion':
      currentValue = this.streaks.consecutiveWeeks;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'explorer':
      currentValue = this.statistics.coursesStarted;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'master':
      currentValue = this.statistics.coursesCompleted;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'innovator':
      currentValue = this.statistics.knowledgeShares;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'leader':
      currentValue = this.statistics.mentorSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'mentor':
      currentValue = this.statistics.mentorSessions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'community_builder':
      currentValue = this.statistics.communityContributions;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
    case 'knowledge_sharer':
      currentValue = this.statistics.knowledgeShares;
      isEarned = currentValue >= achievement.criteria.threshold;
      break;
  }
  
  if (isEarned) {
    if (existingAchievement) {
      // Update existing achievement
      existingAchievement.completions += 1;
      existingAchievement.progress = achievement.criteria.threshold;
      existingAchievement.earnedAt = new Date();
    } else {
      // Add new achievement
      this.achievements.push({
        achievement: achievement._id,
        earnedAt: new Date(),
        progress: achievement.criteria.threshold,
        completions: 1
      });
    }
    
    // Add points reward
    if (achievement.pointsReward > 0) {
      this.addPoints(achievement.pointsReward);
    }
    
    // Add experience reward
    if (achievement.experienceReward > 0) {
      this.addExperience(achievement.experienceReward);
    }
  }
  
  return isEarned;
};

// Update timestamps
studentGamificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentGamification', studentGamificationSchema); 