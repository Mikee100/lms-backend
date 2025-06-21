const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const achievementSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'learning', 'social', 'streak', 'milestone', 'special', 
      'speed', 'accuracy', 'consistency', 'exploration', 'mastery',
      'community', 'innovation', 'leadership', 'mentorship'
    ],
    required: true
  },
  subcategory: {
    type: String,
    enum: [
      'beginner', 'intermediate', 'advanced', 'expert',
      'daily', 'weekly', 'monthly', 'seasonal',
      'course_specific', 'platform_wide', 'social_impact'
    ],
    default: 'beginner'
  },
  criteria: {
    type: {
      type: String,
      enum: [
        'lectures_completed', 'courses_completed', 'streak_days', 
        'points_earned', 'assignments_submitted', 'profile_completion', 
        'social_interactions', 'perfect_scores', 'time_spent_learning',
        'materials_downloaded', 'discussions_participated', 'peer_reviews',
        'mentor_sessions', 'course_creation', 'help_others', 'early_bird',
        'night_owl', 'weekend_warrior', 'speed_learner', 'accuracy_master',
        'consistency_champion', 'explorer', 'master', 'innovator',
        'leader', 'mentor', 'community_builder', 'knowledge_sharer',
        'bookmarks_created', 'notes_taken', 'questions_asked', 'answers_provided',
        'course_ratings', 'feedback_provided', 'course_recommendations'
      ],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    timeFrame: {
      type: String,
      enum: ['lifetime', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'lifetime'
    },
    conditions: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    }
  },
  pointsReward: {
    type: Number,
    default: 0
  },
  experienceReward: {
    type: Number,
    default: 0
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert', 'master'],
    default: 'easy'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  isRepeatable: {
    type: Boolean,
    default: false
  },
  maxCompletions: {
    type: Number,
    default: 1
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  tags: [String],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
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

achievementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema); 