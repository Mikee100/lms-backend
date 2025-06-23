const CourseTemplate = require('../models/CourseTemplate');
const ContentScheduler = require('../models/ContentScheduler');
const CourseVersion = require('../models/CourseVersion');
const CollaborativeCourse = require('../models/CollaborativeCourse');
const Course = require('../models/Course');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

class ContentManagementService {
  // Course Template Management
  static async createTemplate(templateData) {
    const template = await CourseTemplate.create(templateData);
    return template;
  }

  static async getTemplates(filters = {}) {
    const query = { ...filters };
    if (filters.subject) query.subject = filters.subject;
    if (filters.level) query.level = filters.level;
    if (filters.isPublic !== undefined) query.isPublic = filters.isPublic;
    if (filters.status) query.status = filters.status;

    const templates = await CourseTemplate.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ usageCount: -1, rating: { average: -1 } });

    return templates;
  }

  static async getTemplateById(templateId) {
    const template = await CourseTemplate.findById(templateId)
      .populate('createdBy', 'firstName lastName');
    
    if (!template) {
      throw new AppError('Template not found', 404);
    }
    
    return template;
  }

  static async useTemplate(templateId, tutorId, courseData) {
    const template = await this.getTemplateById(templateId);
    
    // Create new course from template
    const course = await Course.create({
      ...courseData,
      tutor: tutorId,
      sections: template.structure.sections.map(section => ({
        title: section.title,
        description: section.description,
        order: section.order,
        lectures: section.lectures.map(lecture => ({
          title: lecture.title,
          description: lecture.description,
          order: lecture.order
        }))
      }))
    });

    // Increment template usage count
    await CourseTemplate.findByIdAndUpdate(templateId, {
      $inc: { usageCount: 1 }
    });

    return course;
  }

  // Content Scheduler Management
  static async createScheduler(schedulerData) {
    const scheduler = await ContentScheduler.create(schedulerData);
    return scheduler;
  }

  static async getSchedulersByCourse(courseId) {
    const schedulers = await ContentScheduler.find({ course: courseId })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    return schedulers;
  }

  static async updateScheduler(schedulerId, updateData) {
    const scheduler = await ContentScheduler.findByIdAndUpdate(
      schedulerId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!scheduler) {
      throw new AppError('Scheduler not found', 404);
    }
    
    return scheduler;
  }

  static async releaseContent(schedulerId, itemId) {
    const scheduler = await ContentScheduler.findById(schedulerId);
    if (!scheduler) {
      throw new AppError('Scheduler not found', 404);
    }

    const item = scheduler.items.id(itemId);
    if (!item) {
      throw new AppError('Schedule item not found', 404);
    }

    item.isReleased = true;
    await scheduler.save();

    // Send notifications to students
    await this.sendReleaseNotifications(scheduler.course, item);

    return scheduler;
  }

  static async sendReleaseNotifications(courseId, item) {
    // This would integrate with your notification system
    console.log(`Sending notifications for ${item.title} in course ${courseId}`);
  }

  // Version Control Management
  static async createVersion(courseId, versionData) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Get next version number
    const lastVersion = await CourseVersion.findOne({ course: courseId })
      .sort({ versionNumber: -1 });
    
    const versionNumber = lastVersion 
      ? this.incrementVersion(lastVersion.versionNumber)
      : '1.0.0';

    // Create snapshot of current course
    const courseSnapshot = {
      title: course.title,
      description: course.description,
      subjects: course.subjects,
      level: course.level,
      price: course.price,
      isFree: course.isFree,
      sections: course.sections,
      thumbnail: course.thumbnail
    };

    const version = await CourseVersion.create({
      ...versionData,
      course: courseId,
      versionNumber,
      courseData: courseSnapshot
    });

    return version;
  }

  static incrementVersion(versionString) {
    const parts = versionString.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  static async getVersions(courseId) {
    const versions = await CourseVersion.find({ course: courseId })
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    return versions;
  }

  static async getVersion(versionId) {
    const version = await CourseVersion.findById(versionId)
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName');
    
    if (!version) {
      throw new AppError('Version not found', 404);
    }
    
    return version;
  }

  static async restoreVersion(versionId) {
    const version = await this.getVersion(versionId);
    
    // Create new version from restored data
    const newVersion = await this.createVersion(version.course, {
      versionName: `Restored from ${version.versionName}`,
      description: `Restored from version ${version.versionNumber}`,
      createdBy: version.createdBy
    });

    // Update course with restored data
    await Course.findByIdAndUpdate(version.course, version.courseData);

    return newVersion;
  }

  static async compareVersions(versionId1, versionId2) {
    const version1 = await this.getVersion(versionId1);
    const version2 = await this.getVersion(versionId2);

    const differences = this.findDifferences(version1.courseData, version2.courseData);
    
    return {
      version1: version1.versionNumber,
      version2: version2.versionNumber,
      differences
    };
  }

  static findDifferences(data1, data2) {
    const differences = [];
    
    // Compare basic fields
    const fields = ['title', 'description', 'level', 'price', 'isFree'];
    fields.forEach(field => {
      if (data1[field] !== data2[field]) {
        differences.push({
          field,
          oldValue: data1[field],
          newValue: data2[field]
        });
      }
    });

    // Compare sections
    const sections1 = data1.sections || [];
    const sections2 = data2.sections || [];
    
    if (sections1.length !== sections2.length) {
      differences.push({
        field: 'sections',
        type: 'count',
        oldValue: sections1.length,
        newValue: sections2.length
      });
    }

    return differences;
  }

  // Collaborative Course Management
  static async createCollaboration(courseId, ownerId) {
    const existing = await CollaborativeCourse.findOne({ course: courseId });
    if (existing) {
      throw new AppError('Collaboration already exists for this course', 400);
    }

    const collaboration = await CollaborativeCourse.create({
      course: courseId,
      collaborators: [{
        tutor: ownerId,
        role: 'owner',
        permissions: {
          canEdit: true,
          canDelete: true,
          canPublish: true,
          canInvite: true,
          canViewAnalytics: true,
          canManageStudents: true
        },
        status: 'accepted',
        joinedAt: new Date()
      }]
    });

    return collaboration;
  }

  static async inviteCollaborator(collaborationId, tutorId, role = 'editor') {
    const collaboration = await CollaborativeCourse.findById(collaborationId);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    // Check if already invited
    const existing = collaboration.collaborators.find(
      c => c.tutor.toString() === tutorId
    );
    
    if (existing) {
      throw new AppError('Tutor already invited to this collaboration', 404);
    }

    collaboration.collaborators.push({
      tutor: tutorId,
      role,
      status: 'pending'
    });

    await collaboration.save();
    return collaboration;
  }

  static async acceptInvitation(collaborationId, tutorId) {
    const collaboration = await CollaborativeCourse.findById(collaborationId);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    const collaborator = collaboration.collaborators.find(
      c => c.tutor.toString() === tutorId
    );
    
    if (!collaborator) {
      throw new AppError('Invitation not found', 404);
    }

    collaborator.status = 'accepted';
    collaborator.joinedAt = new Date();
    await collaboration.save();

    return collaboration;
  }

  static async addComment(collaborationId, commentData) {
    const collaboration = await CollaborativeCourse.findById(collaborationId);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    collaboration.comments.push(commentData);
    await collaboration.save();

    return collaboration;
  }

  static async trackChange(collaborationId, changeData) {
    const collaboration = await CollaborativeCourse.findById(collaborationId);
    if (!collaboration) {
      throw new AppError('Collaboration not found', 404);
    }

    collaboration.changeHistory.push(changeData);
    await collaboration.save();

    return collaboration;
  }

  static async getCollaborationByCourse(courseId) {
    const collaboration = await CollaborativeCourse.findOne({ course: courseId })
      .populate('collaborators.tutor', 'firstName lastName email')
      .populate('comments.tutor', 'firstName lastName')
      .populate('changeHistory.tutor', 'firstName lastName');
    
    return collaboration;
  }

  // Utility Methods
  static async getPopularTemplates(limit = 10) {
    const templates = await CourseTemplate.find({ 
      isPublic: true, 
      status: 'published' 
    })
      .sort({ usageCount: -1, rating: { average: -1 } })
      .limit(limit)
      .populate('createdBy', 'firstName lastName');
    
    return templates;
  }

  static async getTemplatesBySubject(subject) {
    const templates = await CourseTemplate.find({ 
      subject, 
      isPublic: true, 
      status: 'published' 
    })
      .sort({ rating: { average: -1 }, usageCount: -1 })
      .populate('createdBy', 'firstName lastName');
    
    return templates;
  }

  static async searchTemplates(query) {
    const templates = await CourseTemplate.find({
      $and: [
        { isPublic: true, status: 'published' },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    })
      .sort({ rating: { average: -1 }, usageCount: -1 })
      .populate('createdBy', 'firstName lastName');
    
    return templates;
  }
}

module.exports = ContentManagementService; 