// routes/schedule.js
const express = require('express');
const router = express.Router();
const ScheduledClass = require('../models/ScheduledClass');
const Enrollment = require('../models/Enrollment');
const Notifications = require('../models/Notifications');
const Course = require('../models/Course');
const authenticateTutor = require('../Middleware/auth');
const authenticateToken = require('../Middleware/authMiddleware');

// @route POST /api/schedule
// @desc Schedule a new class
router.post('/', authenticateTutor, async (req, res) => {
  try {
    const { courseId, title, description, start, end } = req.body;

    const newClass = new ScheduledClass({
      tutor: req.tutor._id,
      course: courseId,
      title,
      description,
      start,
      end
    });

    await newClass.save();

    // Send alert notifications to enrolled students for this course.
    const [course, enrollments] = await Promise.all([
      Course.findById(courseId).select('title'),
      Enrollment.find({
        course: courseId,
        paymentStatus: { $ne: 'failed' }
      }).select('student')
    ]);

    const uniqueStudentIds = [...new Set(enrollments.map((enrollment) => enrollment.student?.toString()).filter(Boolean))];

    if (uniqueStudentIds.length > 0) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const isValidStart = !Number.isNaN(startDate.getTime());
      const isValidEnd = !Number.isNaN(endDate.getTime());

      const dayLabel = (() => {
        if (!isValidStart) return 'Upcoming';

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const classDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const oneDayMs = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((classDay.getTime() - today.getTime()) / oneDayMs);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        return startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      })();

      const startTime = isValidStart
        ? startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'TBD';
      const endTime = isValidEnd
        ? endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'TBD';

      const courseTitle = course?.title || 'your course';
      const message = `${title}\n${courseTitle}\n${dayLabel}\n${startTime} - ${endTime}`;

      const notificationPayload = uniqueStudentIds.map((studentId) => ({
        recipient: studentId,
        sender: req.tutor._id,
        course: courseId,
        type: 'alert',
        message
      }));

      await Notifications.insertMany(notificationPayload);
    }

    res.status(201).json({ message: 'Class scheduled successfully', class: newClass });
  } catch (err) {
    console.error('Error scheduling class:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/schedule
// @desc Get all classes scheduled by the tutor
router.get('/', authenticateTutor, async (req, res) => {
  try {
    const classes = await ScheduledClass.find({ tutor: req.tutor._id }).populate('course', 'title');
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/schedule/student
// @desc Get all classes for courses the student is enrolled in

router.get('/student', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching classes for student:', req.user.userId);
    
    const enrollments = await Enrollment.find({ student: req.user.userId });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: 'No enrollments found for this student.' });
    }

    const courseIds = enrollments.map(e => e.course);

    const classes = await ScheduledClass.find({ 
      course: { $in: courseIds } 
    })
    .populate('course', 'title')
    .populate('tutor', 'firstName lastName');
    
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



module.exports = router;
