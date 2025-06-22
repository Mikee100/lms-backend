const Organization = require('../models/Organization');
const LearningPath = require('../models/LearningPath');
const EnterpriseAnalytics = require('../models/EnterpriseAnalytics');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

class EnterpriseService {
  // Organization Management
  static async createOrganization(orgData) {
    const organization = await Organization.create(orgData);
    return organization;
  }

  static async getOrganizationById(orgId) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return organization;
  }

  static async getOrganizationByDomain(domain) {
    const organization = await Organization.findOne({ domain: domain.toLowerCase() });
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return organization;
  }

  static async updateOrganization(orgId, updateData) {
    const organization = await Organization.findByIdAndUpdate(
      orgId,
      updateData,
      { new: true, runValidators: true }
    );
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return organization;
  }

  // SSO Integration
  static async configureSSO(orgId, ssoConfig) {
    const organization = await Organization.findByIdAndUpdate(
      orgId,
      { ssoConfig },
      { new: true, runValidators: true }
    );
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return organization;
  }

  static async authenticateSSO(orgId, ssoData) {
    const organization = await this.getOrganizationById(orgId);
    
    if (!organization.ssoConfig.enabled) {
      throw new AppError('SSO is not enabled for this organization', 400);
    }

    // This would integrate with actual SSO providers
    // For now, we'll simulate SSO authentication
    const { email, ssoId } = ssoData;
    
    let student = await Student.findOne({ 
      email, 
      organization: orgId,
      ssoProvider: organization.ssoConfig.provider 
    });

    if (!student) {
      // Create new student account via SSO
      student = await Student.create({
        email,
        ssoId,
        ssoProvider: organization.ssoConfig.provider,
        organization: orgId,
        firstName: ssoData.firstName || '',
        lastName: ssoData.lastName || '',
        department: ssoData.department || '',
        jobTitle: ssoData.jobTitle || ''
      });
    }

    // Update last SSO login
    student.lastSsoLogin = new Date();
    await student.save();

    return student;
  }

  // Learning Path Management
  static async createLearningPath(learningPathData) {
    const learningPath = await LearningPath.create(learningPathData);
    return learningPath;
  }

  static async getLearningPathsByOrganization(orgId, filters = {}) {
    const query = { organization: orgId, ...filters };
    const learningPaths = await LearningPath.find(query)
      .populate('courses.course', 'title description thumbnail')
      .populate('createdBy', 'firstName lastName');
    return learningPaths;
  }

  static async enrollStudentInLearningPath(studentId, learningPathId) {
    const learningPath = await LearningPath.findById(learningPathId);
    if (!learningPath) {
      throw new AppError('Learning path not found', 404);
    }

    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Check if already enrolled
    const existingEnrollment = student.enrolledLearningPaths.find(
      ep => ep.learningPath.toString() === learningPathId
    );

    if (existingEnrollment) {
      throw new AppError('Student already enrolled in this learning path', 400);
    }

    // Enroll in learning path
    student.enrolledLearningPaths.push({
      learningPath: learningPathId,
      currentCourse: learningPath.courses[0]?.course || null
    });

    await student.save();

    // Enroll in first course if exists
    if (learningPath.courses.length > 0) {
      const firstCourse = learningPath.courses[0].course;
      await Enrollment.create({
        student: studentId,
        course: firstCourse,
        enrolledAt: new Date()
      });
    }

    return student;
  }

  static async updateLearningPathProgress(studentId, learningPathId, courseId, progress) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const enrollment = student.enrolledLearningPaths.find(
      ep => ep.learningPath.toString() === learningPathId
    );

    if (!enrollment) {
      throw new AppError('Student not enrolled in this learning path', 404);
    }

    // Update progress
    enrollment.progress = progress;
    enrollment.currentCourse = courseId;

    // Check if learning path is completed
    if (progress >= 100) {
      enrollment.completedAt = new Date();
    }

    await student.save();
    return student;
  }

  // Analytics and Reporting
  static async generateAnalytics(orgId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    
    // Get basic metrics
    const totalUsers = await Student.countDocuments({ organization: orgId });
    const totalCourses = await Course.countDocuments({ organization: orgId });
    const totalLearningPaths = await LearningPath.countDocuments({ organization: orgId });

    // Get enrollment data
    const enrollments = await Enrollment.find({
      student: { $in: await Student.find({ organization: orgId }).select('_id') }
    }).populate('course');

    // Get progress data
    const progressData = await Progress.find({
      student: { $in: await Student.find({ organization: orgId }).select('_id') }
    });

    // Calculate metrics
    const completedCourses = enrollments.filter(e => e.completedAt).length;
    const averageCompletionRate = totalUsers > 0 ? (completedCourses / totalUsers) * 100 : 0;

    // Calculate learning hours
    const totalLearningHours = progressData.reduce((total, progress) => {
      return total + (progress.timeSpent || 0);
    }, 0) / 3600; // Convert seconds to hours

    // Department breakdown
    const students = await Student.find({ organization: orgId }).populate('enrolledLearningPaths.learningPath');
    const departmentMetrics = this.calculateDepartmentMetrics(students);

    const analytics = {
      organization: orgId,
      date: new Date(),
      metrics: {
        totalUsers,
        activeUsers: {
          daily: await this.calculateActiveUsers(orgId, 1),
          weekly: await this.calculateActiveUsers(orgId, 7),
          monthly: await this.calculateActiveUsers(orgId, 30)
        },
        newUsers: await this.calculateNewUsers(orgId, 30),
        totalCourses,
        completedCourses,
        averageCompletionRate,
        totalLearningPaths,
        totalLearningHours,
        departmentMetrics
      },
      breakdowns: {
        byCategory: await this.getCategoryBreakdown(orgId),
        byLevel: await this.getLevelBreakdown(orgId),
        byInstructor: await this.getInstructorBreakdown(orgId)
      }
    };

    // Save analytics
    await EnterpriseAnalytics.create(analytics);
    return analytics;
  }

  static async calculateActiveUsers(orgId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const activeUsers = await Student.countDocuments({
      organization: orgId,
      updatedAt: { $gte: startDate }
    });
    
    return activeUsers;
  }

  static async calculateNewUsers(orgId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const newUsers = await Student.countDocuments({
      organization: orgId,
      createdAt: { $gte: startDate }
    });
    
    return newUsers;
  }

  static calculateDepartmentMetrics(students) {
    const departmentMap = {};
    
    students.forEach(student => {
      const dept = student.department || 'Unassigned';
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          department: dept,
          userCount: 0,
          completionRate: 0,
          averageScore: 0,
          totalHours: 0
        };
      }
      
      departmentMap[dept].userCount++;
      
      // Calculate completion rate for department
      const completedPaths = student.enrolledLearningPaths.filter(ep => ep.completedAt).length;
      const totalPaths = student.enrolledLearningPaths.length;
      if (totalPaths > 0) {
        departmentMap[dept].completionRate += (completedPaths / totalPaths) * 100;
      }
    });

    // Calculate averages
    Object.values(departmentMap).forEach(dept => {
      dept.completionRate = dept.userCount > 0 ? dept.completionRate / dept.userCount : 0;
    });

    return Object.values(departmentMap);
  }

  static async getCategoryBreakdown(orgId) {
    const courses = await Course.find({ organization: orgId });
    const enrollments = await Enrollment.find({
      course: { $in: courses.map(c => c._id) }
    });

    const categoryMap = {};
    courses.forEach(course => {
      course.subjects.forEach(subject => {
        if (!categoryMap[subject]) {
          categoryMap[subject] = {
            category: subject,
            enrollments: 0,
            completions: 0,
            averageScore: 0,
            averageTime: 0
          };
        }
      });
    });

    // Calculate metrics for each category
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c._id.toString() === enrollment.course.toString());
      if (course) {
        course.subjects.forEach(subject => {
          categoryMap[subject].enrollments++;
          if (enrollment.completedAt) {
            categoryMap[subject].completions++;
          }
        });
      }
    });

    return Object.values(categoryMap);
  }

  static async getLevelBreakdown(orgId) {
    const courses = await Course.find({ organization: orgId });
    const enrollments = await Enrollment.find({
      course: { $in: courses.map(c => c._id) }
    });

    const levelMap = {};
    ['beginner', 'intermediate', 'advanced'].forEach(level => {
      levelMap[level] = {
        level,
        enrollments: 0,
        completions: 0,
        averageScore: 0
      };
    });

    enrollments.forEach(enrollment => {
      const course = courses.find(c => c._id.toString() === enrollment.course.toString());
      if (course) {
        levelMap[course.level].enrollments++;
        if (enrollment.completedAt) {
          levelMap[course.level].completions++;
        }
      }
    });

    return Object.values(levelMap);
  }

  static async getInstructorBreakdown(orgId) {
    const courses = await Course.find({ organization: orgId }).populate('tutor');
    const enrollments = await Enrollment.find({
      course: { $in: courses.map(c => c._id) }
    });

    const instructorMap = {};
    courses.forEach(course => {
      const instructorId = course.tutor._id.toString();
      if (!instructorMap[instructorId]) {
        instructorMap[instructorId] = {
          instructor: course.tutor._id,
          courses: 0,
          students: 0,
          averageRating: 0,
          completionRate: 0
        };
      }
      instructorMap[instructorId].courses++;
    });

    enrollments.forEach(enrollment => {
      const course = courses.find(c => c._id.toString() === enrollment.course.toString());
      if (course) {
        const instructorId = course.tutor._id.toString();
        instructorMap[instructorId].students++;
        if (enrollment.completedAt) {
          instructorMap[instructorId].completionRate++;
        }
      }
    });

    // Calculate completion rates
    Object.values(instructorMap).forEach(instructor => {
      instructor.completionRate = instructor.students > 0 
        ? (instructor.completionRate / instructor.students) * 100 
        : 0;
    });

    return Object.values(instructorMap);
  }

  // White-label Solutions
  static async updateBranding(orgId, brandingData) {
    const organization = await Organization.findByIdAndUpdate(
      orgId,
      { customBranding: brandingData },
      { new: true, runValidators: true }
    );
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return organization;
  }

  static async getBrandingConfig(orgId) {
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new AppError('Organization not found', 404);
    }
    return {
      primaryColor: organization.primaryColor,
      secondaryColor: organization.secondaryColor,
      customBranding: organization.customBranding,
      logo: organization.logo
    };
  }
}

module.exports = EnterpriseService; 