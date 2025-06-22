const express = require('express');
const router = express.Router();
const EnterpriseService = require('../services/enterpriseService');
const catchAsync = require('../utils/catchAsync');
const authMiddleware = require('../Middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Configure storage for enterprise uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/enterprise/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for enterprise uploads
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|svg|ico/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, gif, svg, ico) are allowed for branding'));
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for branding assets
});

// Organization Management Routes
router.post('/organizations', catchAsync(async (req, res) => {
  const organization = await EnterpriseService.createOrganization(req.body);
  res.status(201).json({
    status: 'success',
    data: { organization }
  });
}));

router.get('/organizations/:id', catchAsync(async (req, res) => {
  const organization = await EnterpriseService.getOrganizationById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { organization }
  });
}));

router.get('/organizations/domain/:domain', catchAsync(async (req, res) => {
  const organization = await EnterpriseService.getOrganizationByDomain(req.params.domain);
  res.status(200).json({
    status: 'success',
    data: { organization }
  });
}));

router.patch('/organizations/:id', catchAsync(async (req, res) => {
  const organization = await EnterpriseService.updateOrganization(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { organization }
  });
}));

// SSO Integration Routes
router.post('/organizations/:id/sso/configure', catchAsync(async (req, res) => {
  const organization = await EnterpriseService.configureSSO(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { organization }
  });
}));

router.post('/organizations/:id/sso/authenticate', catchAsync(async (req, res) => {
  const student = await EnterpriseService.authenticateSSO(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { student }
  });
}));

// Learning Path Management Routes
router.post('/learning-paths', authMiddleware, catchAsync(async (req, res) => {
  const learningPath = await EnterpriseService.createLearningPath({
    ...req.body,
    createdBy: req.user.id
  });
  res.status(201).json({
    status: 'success',
    data: { learningPath }
  });
}));

router.get('/organizations/:orgId/learning-paths', catchAsync(async (req, res) => {
  const filters = {};
  if (req.query.category) filters.category = req.query.category;
  if (req.query.status) filters.status = req.query.status;
  if (req.query.level) filters.level = req.query.level;

  const learningPaths = await EnterpriseService.getLearningPathsByOrganization(req.params.orgId, filters);
  res.status(200).json({
    status: 'success',
    results: learningPaths.length,
    data: { learningPaths }
  });
}));

router.post('/learning-paths/:id/enroll', authMiddleware, catchAsync(async (req, res) => {
  const student = await EnterpriseService.enrollStudentInLearningPath(req.user.id, req.params.id);
  res.status(200).json({
    status: 'success',
    data: { student }
  });
}));

router.patch('/learning-paths/:id/progress', authMiddleware, catchAsync(async (req, res) => {
  const { courseId, progress } = req.body;
  const student = await EnterpriseService.updateLearningPathProgress(
    req.user.id,
    req.params.id,
    courseId,
    progress
  );
  res.status(200).json({
    status: 'success',
    data: { student }
  });
}));

// Analytics and Reporting Routes
router.get('/organizations/:id/analytics', authMiddleware, catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateRange = {};
  if (startDate) dateRange.startDate = new Date(startDate);
  if (endDate) dateRange.endDate = new Date(endDate);

  const analytics = await EnterpriseService.generateAnalytics(req.params.id, dateRange);
  res.status(200).json({
    status: 'success',
    data: { analytics }
  });
}));

router.get('/organizations/:id/analytics/historical', authMiddleware, catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const EnterpriseAnalytics = require('../models/EnterpriseAnalytics');
  const analytics = await EnterpriseAnalytics.find({
    organization: req.params.id,
    date: { $gte: startDate }
  }).sort({ date: -1 });

  res.status(200).json({
    status: 'success',
    results: analytics.length,
    data: { analytics }
  });
}));

router.get('/organizations/:id/analytics/departments', authMiddleware, catchAsync(async (req, res) => {
  const Student = require('../models/Student');
  const students = await Student.find({ organization: req.params.id })
    .populate('enrolledLearningPaths.learningPath');

  const departmentMetrics = EnterpriseService.calculateDepartmentMetrics(students);
  res.status(200).json({
    status: 'success',
    data: { departmentMetrics }
  });
}));

router.get('/organizations/:id/analytics/categories', authMiddleware, catchAsync(async (req, res) => {
  const categoryBreakdown = await EnterpriseService.getCategoryBreakdown(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { categoryBreakdown }
  });
}));

router.get('/organizations/:id/analytics/instructors', authMiddleware, catchAsync(async (req, res) => {
  const instructorBreakdown = await EnterpriseService.getInstructorBreakdown(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { instructorBreakdown }
  });
}));

// White-label Solutions Routes
router.patch('/organizations/:id/branding', authMiddleware, upload.single('logo'), catchAsync(async (req, res) => {
  const brandingData = { ...req.body };
  
  if (req.file) {
    brandingData.logo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      path: req.file.path,
      size: req.file.size
    };
  }

  const organization = await EnterpriseService.updateBranding(req.params.id, brandingData);
  res.status(200).json({
    status: 'success',
    data: { organization }
  });
}));

router.get('/organizations/:id/branding', catchAsync(async (req, res) => {
  const brandingConfig = await EnterpriseService.getBrandingConfig(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { brandingConfig }
  });
}));

// Enterprise Dashboard Routes
router.get('/organizations/:id/dashboard', authMiddleware, catchAsync(async (req, res) => {
  const Organization = require('../models/Organization');
  const Student = require('../models/Student');
  const Course = require('../models/Course');
  const LearningPath = require('../models/LearningPath');

  const organization = await Organization.findById(req.params.id);
  const totalUsers = await Student.countDocuments({ organization: req.params.id });
  const totalCourses = await Course.countDocuments({ organization: req.params.id });
  const totalLearningPaths = await LearningPath.countDocuments({ organization: req.params.id });

  // Get recent activity
  const recentStudents = await Student.find({ organization: req.params.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('firstName lastName email department createdAt');

  const recentCourses = await Course.find({ organization: req.params.id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title description createdAt')
    .populate('tutor', 'firstName lastName');

  const dashboard = {
    organization,
    summary: {
      totalUsers,
      totalCourses,
      totalLearningPaths
    },
    recentActivity: {
      students: recentStudents,
      courses: recentCourses
    }
  };

  res.status(200).json({
    status: 'success',
    data: { dashboard }
  });
}));

// Compliance and Training Management
router.get('/organizations/:id/compliance-courses', authMiddleware, catchAsync(async (req, res) => {
  const Course = require('../models/Course');
  const courses = await Course.find({
    organization: req.params.id,
    'compliance.isComplianceCourse': true
  }).populate('tutor', 'firstName lastName');

  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: { courses }
  });
}));

router.get('/organizations/:id/expiring-certifications', authMiddleware, catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));

  const Student = require('../models/Student');
  const students = await Student.find({
    organization: req.params.id,
    'certifications.expiryDate': { $lte: expiryDate, $gte: new Date() }
  }).select('firstName lastName email certifications');

  const expiringCertifications = students.flatMap(student => 
    student.certifications
      .filter(cert => cert.expiryDate <= expiryDate && cert.expiryDate >= new Date())
      .map(cert => ({
        student: {
          id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email
        },
        certification: cert
      }))
  );

  res.status(200).json({
    status: 'success',
    results: expiringCertifications.length,
    data: { expiringCertifications }
  });
}));

// User Management for Enterprise
router.get('/organizations/:id/users', authMiddleware, catchAsync(async (req, res) => {
  const { department, role, search } = req.query;
  const Student = require('../models/Student');

  let query = { organization: req.params.id };
  
  if (department) query.department = department;
  if (role) query.jobTitle = { $regex: role, $options: 'i' };
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await Student.find(query)
    .select('-password')
    .populate('enrolledLearningPaths.learningPath', 'title progress')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: students.length,
    data: { students }
  });
}));

router.patch('/organizations/:id/users/:userId', authMiddleware, catchAsync(async (req, res) => {
  const Student = require('../models/Student');
  const student = await Student.findByIdAndUpdate(
    req.params.userId,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!student) {
    return res.status(404).json({
      status: 'error',
      message: 'Student not found'
    });
  }

  res.status(200).json({
    status: 'success',
    data: { student }
  });
}));

module.exports = router; 