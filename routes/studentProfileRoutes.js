const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Student = require('../models/Student');
const authenticateToken = require('../Middleware/authMiddleware');

// Get current student's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: 'Student not found' });
   let profile = await StudentProfile.findOne({ user: student._id }).populate('user', 'firstName lastName email dateOfBirth studentId interests');
    if (!profile) {
      // Create a blank profile if not exists
      profile = new StudentProfile({ user: student._id });
      await profile.save();
    }
    res.json(profile);
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
    const profile = await StudentProfile.findOneAndUpdate(
      { user: student._id },
      { $set: update, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json(profile);
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