// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const authenticateToken = require('../Middleware/authMiddleware'); // Ensure this middleware is correctly implemented
const { OAuth2Client } = require('google-auth-library');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');


router.get('/courses', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch all courses
    const allCourses = await Course.find();

    // Fetch enrolled courses for this student
    const enrolledCourseIds = await Course.find({ students: studentId }).distinct('_id');

    // Add an 'enrolled' field to each course
    const coursesWithEnrollmentStatus = allCourses.map(course => {
      return {
        ...course.toObject(),
        enrolled: enrolledCourseIds.includes(course._id.toString())
      };
    });

    res.json(coursesWithEnrollmentStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/students/courses/:id
// GET a specific course by ID
router.get('/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Course ID:', courseId); // DEBUG

    // Validate MongoDB ObjectId
    if (!courseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findById(courseId)
      .populate('tutor', 'name email') // Only if tutor is a referenced user
      .lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// Import controllers and middleware - verify these paths are correct
const studentController = require('../controllers/studentController');
const validateStudent = require('../Middleware/validateStudent'); // lowercase 'm' in middleware

// Student registration route
router.post(
  '/register',
  validateStudent.register, // Make sure this is the correct exported function name
  studentController.registerStudent
);

router.post('/google-register', async (req, res) => {
  try {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Check if student already exists
    let student = await Student.findOne({ email: payload.email });
    if (student) {
      // Optionally, log them in instead
      return res.status(409).json({ message: 'Student already registered' });
    }

    // Generate a unique 6-digit student number
    let studentId;
    let exists = true;
    while (exists) {
      studentId = Math.floor(100000 + Math.random() * 900000).toString();
      exists = await Student.findOne({ studentId });
    }

    // Create new student
    student = new Student({
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      studentId,
      avatar: payload.picture,
      // Add other fields as needed
    });
    await student.save();

    // Generate JWT for login
    const authToken = jwt.sign(
      { email: student.email, id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: authToken, student });
  } catch (err) {
    console.error('Google registration error:', err);
    res.status(500).json({ message: 'Google registration failed' });
  }
});

module.exports = router;