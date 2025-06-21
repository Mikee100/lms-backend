const express = require('express');
const router = express.Router();
const authenticateToken = require('../Middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');
const StudyGroup = require('../models/StudyGroup');
const Mentorship = require('../models/Mentorship');
const DiscussionForum = require('../models/DiscussionForum');
const Course = require('../models/Course');
const Student = require('../models/Student');

// ==================== STUDY GROUPS ====================

// Get all study groups for a course
router.get('/study-groups/course/:courseId', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { includePrivate = false } = req.query;
        
        const studyGroups = await StudyGroup.findByCourse(courseId, { includePrivate });
        
        res.status(200).json({
            success: true,
            data: studyGroups,
            message: 'Study groups retrieved successfully'
        });
    })
);

// Get study groups for a student
router.get('/study-groups/student/:studentId', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        
        const studyGroups = await StudyGroup.findByStudent(studentId);
        
        res.status(200).json({
            success: true,
            data: studyGroups,
            message: 'Student study groups retrieved successfully'
        });
    })
);

// Create a new study group
router.post('/study-groups', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { name, description, courseId, maxMembers, isPrivate, tags, meetingSchedule } = req.body;
        const creatorId = req.user.id;
        
        const studyGroup = new StudyGroup({
            name,
            description,
            course: courseId,
            creator: creatorId,
            maxMembers: maxMembers || 10,
            isPrivate: isPrivate || false,
            tags: tags || [],
            meetingSchedule: meetingSchedule || {}
        });
        
        // Add creator as leader
        studyGroup.members.push({
            student: creatorId,
            role: 'leader',
            joinedAt: new Date(),
            status: 'active'
        });
        
        await studyGroup.save();
        
        const populatedGroup = await StudyGroup.findById(studyGroup._id)
            .populate('creator', 'firstName lastName avatar')
            .populate('members.student', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(201).json({
            success: true,
            data: populatedGroup,
            message: 'Study group created successfully'
        });
    })
);

// Join a study group
router.post('/study-groups/:groupId/join', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { groupId } = req.params;
        const studentId = req.user.id;
        
        const studyGroup = await StudyGroup.findById(groupId);
        if (!studyGroup) {
            return res.status(404).json({
                success: false,
                message: 'Study group not found'
            });
        }
        
        if (!studyGroup.canJoin(studentId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot join this study group'
            });
        }
        
        await studyGroup.addMember(studentId);
        
        const updatedGroup = await StudyGroup.findById(groupId)
            .populate('creator', 'firstName lastName avatar')
            .populate('members.student', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(200).json({
            success: true,
            data: updatedGroup,
            message: 'Successfully joined study group'
        });
    })
);

// Leave a study group
router.post('/study-groups/:groupId/leave', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { groupId } = req.params;
        const studentId = req.user.id;
        
        const studyGroup = await StudyGroup.findById(groupId);
        if (!studyGroup) {
            return res.status(404).json({
                success: false,
                message: 'Study group not found'
            });
        }
        
        await studyGroup.removeMember(studentId);
        
        res.status(200).json({
            success: true,
            message: 'Successfully left study group'
        });
    })
);

// Add discussion to study group
router.post('/study-groups/:groupId/discussions', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { groupId } = req.params;
        const { title, content, tags } = req.body;
        const authorId = req.user.id;
        
        const studyGroup = await StudyGroup.findById(groupId);
        if (!studyGroup) {
            return res.status(404).json({
                success: false,
                message: 'Study group not found'
            });
        }
        
        if (!studyGroup.isMember(authorId)) {
            return res.status(403).json({
                success: false,
                message: 'You must be a member to post discussions'
            });
        }
        
        studyGroup.discussions.push({
            title,
            content,
            author: authorId,
            tags: tags || []
        });
        
        studyGroup.stats.totalDiscussions += 1;
        await studyGroup.save();
        
        const updatedGroup = await StudyGroup.findById(groupId)
            .populate('discussions.author', 'firstName lastName avatar');
        
        res.status(201).json({
            success: true,
            data: updatedGroup.discussions[updatedGroup.discussions.length - 1],
            message: 'Discussion added successfully'
        });
    })
);

// ==================== MENTORSHIP ====================

// Get available mentors for a course
router.get('/mentorship/mentors/:courseId', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { courseId } = req.params;
        
        const mentors = await Mentorship.findAvailableMentors(courseId);
        
        res.status(200).json({
            success: true,
            data: mentors,
            message: 'Available mentors retrieved successfully'
        });
    })
);

// Get active mentorships for a student
router.get('/mentorship/student/:studentId', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        
        const mentorships = await Mentorship.findActiveByStudent(studentId);
        
        res.status(200).json({
            success: true,
            data: mentorships,
            message: 'Student mentorships retrieved successfully'
        });
    })
);

// Request mentorship
router.post('/mentorship/request', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { mentorId, courseId, goals, communication } = req.body;
        const menteeId = req.user.id;
        
        // Check if mentorship already exists
        const existingMentorship = await Mentorship.findOne({
            mentor: mentorId,
            mentee: menteeId,
            course: courseId,
            status: { $in: ['pending', 'active'] }
        });
        
        if (existingMentorship) {
            return res.status(400).json({
                success: false,
                message: 'Mentorship request already exists'
            });
        }
        
        const mentorship = new Mentorship({
            mentor: mentorId,
            mentee: menteeId,
            course: courseId,
            goals: goals || [],
            communication: communication || {}
        });
        
        await mentorship.save();
        
        const populatedMentorship = await Mentorship.findById(mentorship._id)
            .populate('mentor', 'firstName lastName avatar')
            .populate('mentee', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(201).json({
            success: true,
            data: populatedMentorship,
            message: 'Mentorship request sent successfully'
        });
    })
);

// Accept/Reject mentorship request
router.put('/mentorship/:mentorshipId/status', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { mentorshipId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        
        const mentorship = await Mentorship.findById(mentorshipId);
        if (!mentorship) {
            return res.status(404).json({
                success: false,
                message: 'Mentorship not found'
            });
        }
        
        // Only mentor can accept/reject
        if (mentorship.mentor.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only mentor can update mentorship status'
            });
        }
        
        mentorship.status = status;
        if (status === 'active') {
            mentorship.startDate = new Date();
        }
        
        await mentorship.save();
        
        const updatedMentorship = await Mentorship.findById(mentorshipId)
            .populate('mentor', 'firstName lastName avatar')
            .populate('mentee', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(200).json({
            success: true,
            data: updatedMentorship,
            message: `Mentorship ${status} successfully`
        });
    })
);

// Schedule a mentorship session
router.post('/mentorship/:mentorshipId/sessions', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { mentorshipId } = req.params;
        const { title, description, scheduledAt, duration, topics } = req.body;
        const userId = req.user.id;
        
        const mentorship = await Mentorship.findById(mentorshipId);
        if (!mentorship) {
            return res.status(404).json({
                success: false,
                message: 'Mentorship not found'
            });
        }
        
        // Only mentor or mentee can schedule sessions
        if (![mentorship.mentor.toString(), mentorship.mentee.toString()].includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to schedule sessions'
            });
        }
        
        const sessionData = {
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            topics: topics || []
        };
        
        await mentorship.addSession(sessionData);
        
        const updatedMentorship = await Mentorship.findById(mentorshipId)
            .populate('mentor', 'firstName lastName avatar')
            .populate('mentee', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(201).json({
            success: true,
            data: updatedMentorship.sessions[updatedMentorship.sessions.length - 1],
            message: 'Session scheduled successfully'
        });
    })
);

// ==================== DISCUSSION FORUMS ====================

// Get forums by category
router.get('/forums/category/:category', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { category } = req.params;
        const { includePrivate = false } = req.query;
        
        const forums = await DiscussionForum.findByCategory(category, { includePrivate });
        
        res.status(200).json({
            success: true,
            data: forums,
            message: 'Forums retrieved successfully'
        });
    })
);

// Get forums for a course
router.get('/forums/course/:courseId', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { courseId } = req.params;
        
        const forums = await DiscussionForum.findByCourse(courseId);
        
        res.status(200).json({
            success: true,
            data: forums,
            message: 'Course forums retrieved successfully'
        });
    })
);

// Search forums
router.get('/forums/search', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { q: searchTerm, category, includePrivate = false } = req.query;
        
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }
        
        const forums = await DiscussionForum.search(searchTerm, { category, includePrivate });
        
        res.status(200).json({
            success: true,
            data: forums,
            message: 'Search results retrieved successfully'
        });
    })
);

// Create a new forum
router.post('/forums', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { title, description, category, courseId, tags, rules, settings } = req.body;
        const creatorId = req.user.id;
        
        const forum = new DiscussionForum({
            title,
            description,
            category,
            course: courseId,
            creator: creatorId,
            tags: tags || [],
            rules: rules || [],
            settings: settings || {}
        });
        
        await forum.save();
        
        const populatedForum = await DiscussionForum.findById(forum._id)
            .populate('creator', 'firstName lastName avatar')
            .populate('course', 'title thumbnail');
        
        res.status(201).json({
            success: true,
            data: populatedForum,
            message: 'Forum created successfully'
        });
    })
);

// Add a topic to a forum
router.post('/forums/:forumId/topics', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { forumId } = req.params;
        const { title, content, tags, attachments } = req.body;
        const authorId = req.user.id;
        
        const forum = await DiscussionForum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found'
            });
        }
        
        if (forum.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Forum is locked'
            });
        }
        
        const topicData = {
            title,
            content,
            author: authorId,
            tags: tags || [],
            attachments: attachments || []
        };
        
        await forum.addTopic(topicData);
        
        const updatedForum = await DiscussionForum.findById(forumId)
            .populate('topics.author', 'firstName lastName avatar');
        
        res.status(201).json({
            success: true,
            data: updatedForum.topics[updatedForum.topics.length - 1],
            message: 'Topic created successfully'
        });
    })
);

// Add a reply to a topic
router.post('/forums/:forumId/topics/:topicId/replies', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { forumId, topicId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;
        
        const forum = await DiscussionForum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found'
            });
        }
        
        const topic = forum.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found'
            });
        }
        
        if (topic.isLocked) {
            return res.status(403).json({
                success: false,
                message: 'Topic is locked'
            });
        }
        
        const replyData = {
            content,
            author: authorId
        };
        
        await forum.addReply(topicId, replyData);
        
        const updatedForum = await DiscussionForum.findById(forumId)
            .populate('topics.replies.author', 'firstName lastName avatar');
        
        const updatedTopic = updatedForum.topics.id(topicId);
        
        res.status(201).json({
            success: true,
            data: updatedTopic.replies[updatedTopic.replies.length - 1],
            message: 'Reply added successfully'
        });
    })
);

// Like/Unlike a topic
router.post('/forums/:forumId/topics/:topicId/like', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { forumId, topicId } = req.params;
        const studentId = req.user.id;
        
        const forum = await DiscussionForum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found'
            });
        }
        
        await forum.toggleTopicLike(topicId, studentId);
        
        res.status(200).json({
            success: true,
            message: 'Topic like toggled successfully'
        });
    })
);

// View a topic
router.post('/forums/:forumId/topics/:topicId/view', 
    authenticateToken, 
    catchAsync(async (req, res) => {
        const { forumId, topicId } = req.params;
        
        const forum = await DiscussionForum.findById(forumId);
        if (!forum) {
            return res.status(404).json({
                success: false,
                message: 'Forum not found'
            });
        }
        
        await forum.viewTopic(topicId);
        
        res.status(200).json({
            success: true,
            message: 'Topic view recorded'
        });
    })
);

module.exports = router; 