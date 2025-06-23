const express = require('express');
const router = express.Router();
const ContentManagementService = require('../services/contentManagementService');
const authMiddleware = require('../Middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed'));
    }
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ===== COURSE TEMPLATES =====

// Get all templates with filters
router.get('/templates', catchAsync(async (req, res) => {
  const filters = {
    subject: req.query.subject,
    level: req.query.level,
    isPublic: req.query.isPublic === 'true',
    status: req.query.status
  };

  const templates = await ContentManagementService.getTemplates(filters);
  res.json({
    success: true,
    data: templates
  });
}));

// Get popular templates
router.get('/templates/popular', catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const templates = await ContentManagementService.getPopularTemplates(limit);
  
  res.json({
    success: true,
    data: templates
  });
}));

// Search templates
router.get('/templates/search', catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  const templates = await ContentManagementService.searchTemplates(q);
  res.json({
    success: true,
    data: templates
  });
}));

// Get template by ID
router.get('/templates/:id', catchAsync(async (req, res) => {
  const template = await ContentManagementService.getTemplateById(req.params.id);
  res.json({
    success: true,
    data: template
  });
}));

// Create new template
router.post('/templates', upload.single('thumbnail'), catchAsync(async (req, res) => {
  const templateData = {
    ...req.body,
    createdBy: req.user.id
  };

  if (req.file) {
    templateData.thumbnail = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      path: req.file.path,
      size: req.file.size
    };
  }

  const template = await ContentManagementService.createTemplate(templateData);
  res.status(201).json({
    success: true,
    data: template
  });
}));

// Use template to create course
router.post('/templates/:id/use', catchAsync(async (req, res) => {
  const course = await ContentManagementService.useTemplate(
    req.params.id,
    req.user.id,
    req.body
  );
  
  res.status(201).json({
    success: true,
    data: course
  });
}));

// ===== CONTENT SCHEDULER =====

// Get schedulers for a course
router.get('/courses/:courseId/schedulers', catchAsync(async (req, res) => {
  const schedulers = await ContentManagementService.getSchedulersByCourse(req.params.courseId);
  res.json({
    success: true,
    data: schedulers
  });
}));

// Create new scheduler
router.post('/schedulers', catchAsync(async (req, res) => {
  const schedulerData = {
    ...req.body,
    createdBy: req.user.id
  };

  const scheduler = await ContentManagementService.createScheduler(schedulerData);
  res.status(201).json({
    success: true,
    data: scheduler
  });
}));

// Update scheduler
router.put('/schedulers/:id', catchAsync(async (req, res) => {
  const scheduler = await ContentManagementService.updateScheduler(req.params.id, req.body);
  res.json({
    success: true,
    data: scheduler
  });
}));

// Release content item
router.post('/schedulers/:id/release/:itemId', catchAsync(async (req, res) => {
  const scheduler = await ContentManagementService.releaseContent(req.params.id, req.params.itemId);
  res.json({
    success: true,
    data: scheduler
  });
}));

// ===== VERSION CONTROL =====

// Get versions for a course
router.get('/courses/:courseId/versions', catchAsync(async (req, res) => {
  const versions = await ContentManagementService.getVersions(req.params.courseId);
  res.json({
    success: true,
    data: versions
  });
}));

// Create new version
router.post('/courses/:courseId/versions', catchAsync(async (req, res) => {
  const versionData = {
    ...req.body,
    createdBy: req.user.id
  };

  const version = await ContentManagementService.createVersion(req.params.courseId, versionData);
  res.status(201).json({
    success: true,
    data: version
  });
}));

// Get specific version
router.get('/versions/:id', catchAsync(async (req, res) => {
  const version = await ContentManagementService.getVersion(req.params.id);
  res.json({
    success: true,
    data: version
  });
}));

// Restore version
router.post('/versions/:id/restore', catchAsync(async (req, res) => {
  const newVersion = await ContentManagementService.restoreVersion(req.params.id);
  res.json({
    success: true,
    data: newVersion
  });
}));

// Compare versions
router.get('/versions/compare', catchAsync(async (req, res) => {
  const { version1, version2 } = req.query;
  if (!version1 || !version2) {
    return res.status(400).json({
      success: false,
      message: 'Both version IDs are required'
    });
  }

  const comparison = await ContentManagementService.compareVersions(version1, version2);
  res.json({
    success: true,
    data: comparison
  });
}));

// ===== COLLABORATIVE COURSES =====

// Get collaboration for a course
router.get('/courses/:courseId/collaboration', catchAsync(async (req, res) => {
  const collaboration = await ContentManagementService.getCollaborationByCourse(req.params.courseId);
  res.json({
    success: true,
    data: collaboration
  });
}));

// Create collaboration
router.post('/courses/:courseId/collaboration', catchAsync(async (req, res) => {
  const collaboration = await ContentManagementService.createCollaboration(req.params.courseId, req.user.id);
  res.status(201).json({
    success: true,
    data: collaboration
  });
}));

// Invite collaborator
router.post('/collaboration/:id/invite', catchAsync(async (req, res) => {
  const { tutorId, role } = req.body;
  const collaboration = await ContentManagementService.inviteCollaborator(req.params.id, tutorId, role);
  res.json({
    success: true,
    data: collaboration
  });
}));

// Accept invitation
router.post('/collaboration/:id/accept', catchAsync(async (req, res) => {
  const collaboration = await ContentManagementService.acceptInvitation(req.params.id, req.user.id);
  res.json({
    success: true,
    data: collaboration
  });
}));

// Add comment
router.post('/collaboration/:id/comments', catchAsync(async (req, res) => {
  const commentData = {
    ...req.body,
    tutor: req.user.id
  };

  const collaboration = await ContentManagementService.addComment(req.params.id, commentData);
  res.json({
    success: true,
    data: collaboration
  });
}));

// Track change
router.post('/collaboration/:id/changes', catchAsync(async (req, res) => {
  const changeData = {
    ...req.body,
    tutor: req.user.id
  };

  const collaboration = await ContentManagementService.trackChange(req.params.id, changeData);
  res.json({
    success: true,
    data: collaboration
  });
}));

// ===== UTILITY ROUTES =====

// Get templates by subject
router.get('/templates/subject/:subject', catchAsync(async (req, res) => {
  const templates = await ContentManagementService.getTemplatesBySubject(req.params.subject);
  res.json({
    success: true,
    data: templates
  });
}));

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + error.message
    });
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

module.exports = router; 