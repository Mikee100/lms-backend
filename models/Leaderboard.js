const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderboardSchema = new Schema({
  type: {
    type: String,
    enum: ['total', 'weekly', 'monthly'],
    required: true
  },
  period: {
    type: String,
    required: true
  },
  entries: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student'
    },
    points: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      required: true
    },
    achievements: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    streak: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
leaderboardSchema.index({ type: 1, period: 1 }, { unique: true });

// Update timestamp on save
leaderboardSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Method to update leaderboard
leaderboardSchema.methods.updateLeaderboard = async function() {
  const StudentGamification = mongoose.model('StudentGamification');
  
  let query = {};
  let sortField = 'totalPointsEarned';
  
  // Set query based on leaderboard type
  switch (this.type) {
    case 'weekly':
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      query = { 'leaderboardStats.weeklyPoints': { $gt: 0 } };
      sortField = 'leaderboardStats.weeklyPoints';
      break;
    case 'monthly':
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      query = { 'leaderboardStats.monthlyPoints': { $gt: 0 } };
      sortField = 'leaderboardStats.monthlyPoints';
      break;
    default: // total
      query = { totalPointsEarned: { $gt: 0 } };
      sortField = 'totalPointsEarned';
  }
  
  // Get top students
  const students = await StudentGamification.find(query)
    .populate('student', 'firstName lastName avatar')
    .sort({ [sortField]: -1 })
    .limit(100);
  
  // Update entries
  this.entries = students.map((student, index) => ({
    student: student.student._id,
    points: student[sortField] || 0,
    rank: index + 1,
    achievements: student.achievements.length,
    level: student.level,
    streak: student.streaks.currentStreak
  }));
  
  return this.save();
};

module.exports = mongoose.model('Leaderboard', leaderboardSchema); 