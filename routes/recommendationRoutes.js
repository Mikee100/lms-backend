const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const authMiddleware = require('../Middleware/authMiddleware');
const catchAsync = require('../utils/catchAsync');

// Get personalized course recommendations for a student
router.get('/courses/:studentId', 
    authMiddleware.authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        const { limit = 10, includeSimilar = true } = req.query;
        
        const recommendations = await recommendationService.getPersonalizedRecommendations(
            studentId, 
            parseInt(limit), 
            includeSimilar === 'true'
        );
        
        res.status(200).json({
            success: true,
            data: recommendations,
            message: 'Personalized recommendations retrieved successfully'
        });
    })
);

// Get trending courses (popular courses)
router.get('/trending', 
    catchAsync(async (req, res) => {
        const { limit = 10 } = req.query;
        
        const trendingCourses = await recommendationService.getTrendingCourses(parseInt(limit));
        
        res.status(200).json({
            success: true,
            data: trendingCourses,
            message: 'Trending courses retrieved successfully'
        });
    })
);

// Get courses similar to a specific course
router.get('/similar/:courseId', 
    catchAsync(async (req, res) => {
        const { courseId } = req.params;
        const { limit = 5 } = req.query;
        
        const similarCourses = await recommendationService.getSimilarCourses(
            courseId, 
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            data: similarCourses,
            message: 'Similar courses retrieved successfully'
        });
    })
);

// Get skill-based recommendations
router.get('/skills/:studentId', 
    authMiddleware.authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        const { skillLevel = 'intermediate', limit = 5 } = req.query;
        
        const skillRecommendations = await recommendationService.getSkillBasedRecommendations(
            studentId, 
            skillLevel, 
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            data: skillRecommendations,
            message: 'Skill-based recommendations retrieved successfully'
        });
    })
);

// Get collaborative filtering recommendations
router.get('/collaborative/:studentId', 
    authMiddleware.authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        const { limit = 10 } = req.query;
        
        const collaborativeRecommendations = await recommendationService.getCollaborativeRecommendations(
            studentId, 
            parseInt(limit)
        );
        
        res.status(200).json({
            success: true,
            data: collaborativeRecommendations,
            message: 'Collaborative filtering recommendations retrieved successfully'
        });
    })
);

// Update user preferences for better recommendations
router.post('/preferences/:studentId', 
    authMiddleware.authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        const { interests, skillLevel, learningGoals, preferredCategories } = req.body;
        
        const updatedPreferences = await recommendationService.updateUserPreferences(
            studentId, 
            { interests, skillLevel, learningGoals, preferredCategories }
        );
        
        res.status(200).json({
            success: true,
            data: updatedPreferences,
            message: 'User preferences updated successfully'
        });
    })
);

// Get recommendation insights and explanations
router.get('/insights/:studentId', 
    authMiddleware.authenticateToken, 
    catchAsync(async (req, res) => {
        const { studentId } = req.params;
        
        const insights = await recommendationService.getRecommendationInsights(studentId);
        
        res.status(200).json({
            success: true,
            data: insights,
            message: 'Recommendation insights retrieved successfully'
        });
    })
);

module.exports = router; 