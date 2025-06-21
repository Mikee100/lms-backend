const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Student = require('../models/Student');
const authenticateToken = require('../Middleware/authMiddleware');
const GamificationService = require('../services/gamificationService');

// Get current student's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Fetch all student fields (no select, except exclude password)
    const fullStudent = await Student.findById(student._id).lean();
    console.log('Full Student:', fullStudent);

    if (fullStudent && fullStudent.password) delete fullStudent.password;
    let profile = await StudentProfile.findOne({ user: student._id }).lean();
    if (!profile) {
      // Create a blank profile if not exists
      profile = (await new StudentProfile({ user: student._id }).save()).toObject();
    }
    res.json({ ...profile, user: fullStudent });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current student's profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const update = req.body;
    update.updatedAt = new Date();
    
    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      { $set: update },
      { new: true }
    );

    // Check if profile is now complete and award points
    try {
      const profileFields = [
        'firstName', 'lastName', 'email', 'dateOfBirth', 'studentId', 
        'bio', 'avatar', 'interests'
      ];
      
      const hasSocialLinks = update.socialLinks && 
        Object.values(update.socialLinks).some(val => val && val.trim() !== '');
      const hasContact = update.contact && 
        Object.values(update.contact).some(val => val && val.trim() !== '');
      
      const filledFields = profileFields.filter(field => 
        update[field] && update[field].toString().trim() !== ''
      ).length + (hasSocialLinks ? 1 : 0) + (hasContact ? 1 : 0);
      
      const totalFields = profileFields.length + 2; // +2 for socialLinks and contact
      const completionPercent = Math.round((filledFields / totalFields) * 100);
      
      // Award points for profile completion milestones
      if (completionPercent >= 50 && completionPercent < 100) {
        await GamificationService.awardPoints(
          student._id,
          'profile_completed',
          50, // 50 points for 50% completion
          { completionPercent }
        );
      } else if (completionPercent === 100) {
        await GamificationService.awardPoints(
          student._id,
          'profile_completed',
          100, // 100 points for 100% completion
          { completionPercent }
        );
      }
    } catch (gamificationError) {
      console.error('Gamification error in profile update:', gamificationError);
      // Continue with response even if gamification fails
    }

    res.json(updatedStudent);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a student's profile by student ID (for tutors/admins)
router.get('/:studentId', authenticateToken, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.params.studentId }).populate('user', 'firstName lastName email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;