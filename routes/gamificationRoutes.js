const express = require('express');
const router = express.Router();
const authenticateToken = require('../Middleware/authMiddleware');
const GamificationService = require('../services/gamificationService');
const Achievement = require('../models/Achievement');
const StudentGamification = require('../models/StudentGamification');

// Get student's gamification profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const profile = await GamificationService.getStudentProfile(studentId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting gamification profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gamification profile'
    });
  }
});

// Get leaderboard (type as query param)
router.get('/leaderboard', async (req, res) => {
  try {
    const type = req.query.type || 'total';
    const limit = parseInt(req.query.limit) || 50;
    
    const leaderboard = await GamificationService.getLeaderboard(type, limit);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
});

// Get student's rank (type as query param)
router.get('/rank', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const type = req.query.type || 'total';
    
    const rank = await GamificationService.getStudentRank(studentId, type);
    
    res.json({
      success: true,
      data: { rank }
    });
  } catch (error) {
    console.error('Error getting student rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student rank'
    });
  }
});

// Get achievements progress
router.get('/achievements/progress', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const progress = await GamificationService.getAchievementsProgress(studentId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting achievements progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements progress'
    });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ rarity: 1, name: 1 });
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
});

// Get daily challenges
router.get('/challenges/daily', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const challenges = await GamificationService.getDailyChallenges(studentId);
    
    res.json({
      success: true,
      data: challenges
    });
  } catch (error) {
    console.error('Error getting daily challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily challenges'
    });
  }
});

// Award points (for testing and admin use)
router.post('/award-points', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const { activity, points, metadata } = req.body;
    
    if (!activity || !points) {
      return res.status(400).json({
        success: false,
        message: 'Activity and points are required'
      });
    }
    
    const result = await GamificationService.awardPoints(studentId, activity, points, metadata);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award points'
    });
  }
});

// Get level information
router.get('/level/:level', (req, res) => {
  try {
    const level = parseInt(req.params.level) || 1;
    const levelInfo = GamificationService.getLevelInfo(level);
    
    res.json({
      success: true,
      data: levelInfo
    });
  } catch (error) {
    console.error('Error getting level info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get level information'
    });
  }
});

// Update gamification preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const { showLeaderboard, showAchievements, notifications } = req.body;
    
    const gamification = await StudentGamification.findOne({ student: studentId });
    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found'
      });
    }
    
    if (showLeaderboard !== undefined) gamification.preferences.showLeaderboard = showLeaderboard;
    if (showAchievements !== undefined) gamification.preferences.showAchievements = showAchievements;
    if (notifications !== undefined) gamification.preferences.notifications = notifications;
    
    await gamification.save();
    
    res.json({
      success: true,
      data: gamification.preferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// Get student statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const gamification = await StudentGamification.findOne({ student: studentId });
    
    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found'
      });
    }
    
    res.json({
      success: true,
      data: gamification.statistics
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Get streak information
router.get('/streak', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const gamification = await StudentGamification.findOne({ student: studentId });
    
    if (!gamification) {
      return res.status(404).json({
        success: false,
        message: 'Gamification profile not found'
      });
    }
    
    res.json({
      success: true,
      data: gamification.streaks
    });
  } catch (error) {
    console.error('Error getting streak info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get streak information'
    });
  }
});

// Admin routes for managing achievements
router.post('/admin/achievements', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement admin check)
    const { name, description, icon, category, criteria, pointsReward, rarity } = req.body;
    
    const achievement = new Achievement({
      name,
      description,
      icon,
      category,
      criteria,
      pointsReward,
      rarity
    });
    
    await achievement.save();
    
    res.status(201).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create achievement'
    });
  }
});

// Get gamification dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    
    // Get all gamification data in parallel
    const [profile, achievementsProgress, dailyChallenges, totalRank, weeklyRank] = await Promise.all([
      GamificationService.getStudentProfile(studentId),
      GamificationService.getAchievementsProgress(studentId),
      GamificationService.getDailyChallenges(studentId),
      GamificationService.getStudentRank(studentId, 'total'),
      GamificationService.getStudentRank(studentId, 'weekly')
    ]);
    
    const levelInfo = GamificationService.getLevelInfo(profile.level);
    
    res.json({
      success: true,
      data: {
        profile,
        achievementsProgress,
        dailyChallenges,
        ranks: {
          total: totalRank,
          weekly: weeklyRank
        },
        levelInfo
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data'
    });
  }
});

module.exports = router; 