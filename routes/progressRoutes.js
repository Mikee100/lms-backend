const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const authenticateToken = require('../Middleware/authMiddleware');
const GamificationService = require('../services/gamificationService');
const Course = require('../models/Course');

// Get progress for a course
router.get('/:courseId', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const { courseId } = req.params;
    const progress = await Progress.findOne({ student: studentId, course: courseId });
    res.json(progress || { completedLectures: [], completedMaterials: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a lecture as completed
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId || req.user.id;
    const { courseId, lectureId } = req.body;
    
    if (!courseId || !lectureId) {
      return res.status(400).json({ message: 'Missing courseId or lectureId' });
    }

    // Update progress
    const progress = await Progress.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedLectures: lectureId }, $set: { lastAccessed: new Date() } },
      { upsert: true, new: true }
    );

    // Award gamification points for lecture completion
    try {
      const gamificationResult = await GamificationService.awardPoints(
        studentId, 
        'lecture_completed', 
        25, // 25 points for completing a lecture
        { courseId, lectureId }
      );

      console.log('Gamification result:', gamificationResult);

      // Check if course is completed
      const course = await Course.findById(courseId);
      if (course && course.sections) {
        const totalLectures = course.sections.reduce((sum, section) => 
          sum + (section.lectures?.length || 0), 0
        );
        
        if (progress.completedLectures.length >= totalLectures) {
          // Course completed! Award bonus points
          await GamificationService.awardPoints(
            studentId,
            'course_completed',
            100, // 100 bonus points for completing a course
            { courseId }
          );
        }
      }

      // Return success with gamification data
      res.json({ 
        success: true, 
        gamification: {
          pointsEarned: gamificationResult.newPoints,
          newAchievements: gamificationResult.newAchievements,
          levelUp: gamificationResult.newLevel ? { newLevel: gamificationResult.newLevel } : null
        },
        progress: progress
      });
    } catch (gamificationError) {
      console.error('Gamification error:', gamificationError);
      // Still return success even if gamification fails
      res.json({ success: true, progress: progress });
    }
  } catch (err) {
    console.error('Error marking lecture complete:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;