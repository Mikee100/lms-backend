const StudentGamification = require('../models/StudentGamification');
const Achievement = require('../models/Achievement');
const Leaderboard = require('../models/Leaderboard');
const Activity = require('../models/Activity');

class GamificationService {
  // Initialize gamification profile for a new student
  static async initializeStudent(studentId) {
    try {
      const existing = await StudentGamification.findOne({ student: studentId });
      if (existing) return existing;

      const gamification = new StudentGamification({
        student: studentId
      });
      
      await gamification.save();
      return gamification;
    } catch (error) {
      console.error('Error initializing student gamification:', error);
      throw error;
    }
  }

  // Award points for various activities
  static async awardPoints(studentId, activity, points, metadata = {}) {
    try {
      const gamification = await StudentGamification.findOne({ student: studentId });
      if (!gamification) {
        await this.initializeStudent(studentId);
      }

      const updatedGamification = await StudentGamification.findOne({ student: studentId });
      
      // Add points
      const newPoints = updatedGamification.addPoints(points);
      
      // Add experience (1 point = 1 XP)
      const newLevel = updatedGamification.addExperience(points);
      
      // Update statistics based on activity
      await this.updateStatistics(updatedGamification, activity, metadata);
      
      // Update streaks
      await this.updateStreak(updatedGamification);
      
      // Check for achievements
      const newAchievements = await this.checkAchievements(updatedGamification);
      
      // Update leaderboard stats
      await this.updateLeaderboardStats(updatedGamification, points);
      
      await updatedGamification.save();
      
      return {
        newPoints,
        newLevel,
        newAchievements,
        currentStreak: updatedGamification.streaks.currentStreak
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Update student statistics
  static async updateStatistics(gamification, activity, metadata = {}) {
    switch (activity) {
      case 'lecture_completed':
        gamification.statistics.lecturesCompleted++;
        break;
      case 'course_completed':
        gamification.statistics.coursesCompleted++;
        break;
      case 'assignment_submitted':
        gamification.statistics.assignmentsSubmitted++;
        if (metadata.score === 100) {
          gamification.statistics.perfectScores++;
        }
        break;
      case 'social_interaction':
        gamification.statistics.socialInteractions++;
        break;
      case 'profile_completed':
        // Handle profile completion
        break;
    }
  }

  // Update learning streak
  static async updateStreak(gamification) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActivity = gamification.streaks.lastActivityDate;
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    
    if (lastActivityDate) {
      lastActivityDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day
        gamification.streaks.currentStreak++;
        if (gamification.streaks.currentStreak > gamification.streaks.longestStreak) {
          gamification.streaks.longestStreak = gamification.streaks.currentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        gamification.streaks.currentStreak = 1;
      }
      // If daysDiff === 0, same day, don't change streak
    } else {
      // First activity
      gamification.streaks.currentStreak = 1;
    }
    
    gamification.streaks.lastActivityDate = today;
  }

  // Check and award achievements
  static async checkAchievements(gamification) {
    try {
      const achievements = await Achievement.find({ isActive: true });
      const newAchievements = [];
      
      for (const achievement of achievements) {
        const isEarned = gamification.checkAchievement(achievement);
        if (isEarned) {
          newAchievements.push(achievement);
        }
      }
      
      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Update leaderboard statistics
  static async updateLeaderboardStats(gamification, points) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Update weekly points if activity is in current week
    if (gamification.streaks.lastActivityDate >= weekStart) {
      gamification.leaderboardStats.weeklyPoints += points;
    }
    
    // Update monthly points if activity is in current month
    if (gamification.streaks.lastActivityDate >= monthStart) {
      gamification.leaderboardStats.monthlyPoints += points;
    }
  }

  // Get student gamification profile
  static async getStudentProfile(studentId) {
    try {
      let gamification = await StudentGamification.findOne({ student: studentId })
        .populate('achievements.achievement')
        .populate('student', 'firstName lastName avatar');
      
      if (!gamification) {
        gamification = await this.initializeStudent(studentId);
      }
      
      return gamification;
    } catch (error) {
      console.error('Error getting student profile:', error);
      throw error;
    }
  }

  // Get leaderboard
  static async getLeaderboard(type = 'total', limit = 50) {
    try {
      const period = this.getPeriodString(type);
      
      let leaderboard = await Leaderboard.findOne({ type, period });
      
      if (!leaderboard) {
        leaderboard = new Leaderboard({ type, period, entries: [] });
        await leaderboard.save();
      }
      
      // Update leaderboard if it's old (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (leaderboard.lastUpdated < oneHourAgo) {
        await leaderboard.updateLeaderboard();
      }
      
      return await Leaderboard.findOne({ type, period })
        .populate('entries.student', 'firstName lastName avatar')
        .limit(limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Get period string for leaderboard
  static getPeriodString(type) {
    const now = new Date();
    
    switch (type) {
      case 'weekly':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      default:
        return 'all-time';
    }
  }

  // Get student rank
  static async getStudentRank(studentId, type = 'total') {
    try {
      const leaderboard = await this.getLeaderboard(type);
      const studentEntry = leaderboard.entries.find(entry => 
        entry.student.toString() === studentId.toString()
      );
      
      return studentEntry ? studentEntry.rank : null;
    } catch (error) {
      console.error('Error getting student rank:', error);
      return null;
    }
  }

  // Get achievements progress
  static async getAchievementsProgress(studentId) {
    try {
      const gamification = await StudentGamification.findOne({ student: studentId });
      const achievements = await Achievement.find({ isActive: true });
      
      const progress = achievements.map(achievement => {
        const earned = gamification.achievements.find(a => 
          a.achievement.toString() === achievement._id.toString()
        );
        
        let currentValue = 0;
        switch (achievement.criteria.type) {
          case 'lectures_completed':
            currentValue = gamification.statistics.lecturesCompleted;
            break;
          case 'courses_completed':
            currentValue = gamification.statistics.coursesCompleted;
            break;
          case 'streak_days':
            currentValue = gamification.streaks.currentStreak;
            break;
          case 'points_earned':
            currentValue = gamification.totalPointsEarned;
            break;
          case 'assignments_submitted':
            currentValue = gamification.statistics.assignmentsSubmitted;
            break;
          case 'perfect_scores':
            currentValue = gamification.statistics.perfectScores;
            break;
          case 'social_interactions':
            currentValue = gamification.statistics.socialInteractions;
            break;
        }
        
        return {
          achievement,
          earned: !!earned,
          earnedAt: earned ? earned.earnedAt : null,
          progress: Math.min(currentValue, achievement.criteria.threshold),
          threshold: achievement.criteria.threshold,
          percentage: Math.min((currentValue / achievement.criteria.threshold) * 100, 100)
        };
      });
      
      return progress;
    } catch (error) {
      console.error('Error getting achievements progress:', error);
      return [];
    }
  }

  // Get daily challenges
  static async getDailyChallenges(studentId) {
    try {
      const gamification = await StudentGamification.findOne({ student: studentId });
      const today = new Date().toDateString();
      
      // Generate daily challenges based on current stats
      const challenges = [
        {
          id: 'daily_lectures',
          title: 'Complete 3 Lectures Today',
          description: 'Watch and complete 3 lectures to earn bonus points',
          type: 'lectures_completed',
          target: 3,
          reward: 50,
          progress: Math.min(gamification.statistics.lecturesCompleted, 3),
          completed: gamification.statistics.lecturesCompleted >= 3
        },
        {
          id: 'daily_streak',
          title: 'Maintain Your Streak',
          description: 'Log in today to keep your learning streak alive',
          type: 'streak_maintenance',
          target: 1,
          reward: 25,
          progress: gamification.streaks.currentStreak > 0 ? 1 : 0,
          completed: gamification.streaks.currentStreak > 0
        },
        {
          id: 'daily_points',
          title: 'Earn 100 Points Today',
          description: 'Complete activities to earn 100 points',
          type: 'points_earned',
          target: 100,
          reward: 75,
          progress: Math.min(gamification.leaderboardStats.weeklyPoints, 100),
          completed: gamification.leaderboardStats.weeklyPoints >= 100
        }
      ];
      
      return challenges;
    } catch (error) {
      console.error('Error getting daily challenges:', error);
      return [];
    }
  }

  // Get level information
  static getLevelInfo(level) {
    const baseXP = 100;
    let totalXP = 0;
    let currentLevelXP = 0;
    
    for (let i = 1; i <= level; i++) {
      if (i === level) {
        currentLevelXP = totalXP;
      }
      totalXP += baseXP * Math.pow(1.5, i - 1);
    }
    
    const nextLevelXP = totalXP;
    const currentLevelRequiredXP = currentLevelXP + baseXP * Math.pow(1.5, level - 1);
    
    return {
      level,
      currentLevelXP,
      nextLevelXP,
      currentLevelRequiredXP,
      progress: ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    };
  }
}

module.exports = GamificationService; 