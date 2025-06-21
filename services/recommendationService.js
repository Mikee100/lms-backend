const Recommendation = require('../models/Recommendation');
const Course = require('../models/Course');
const StudentGamification = require('../models/StudentGamification');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');

class RecommendationService {
  // Generate personalized recommendations for a student
  static async generateRecommendations(studentId, limit = 10) {
    try {
      console.log(`Generating recommendations for student: ${studentId}`);
      
      // Get student data
      const studentData = await this.getStudentData(studentId);
      const allCourses = await Course.find({ isActive: true }).populate('tutor', 'firstName lastName');
      
      // Generate recommendations using multiple algorithms
      const recommendations = [];
      
      // 1. Skill-based recommendations
      const skillBasedRecs = await this.getSkillBasedRecommendations(studentData, allCourses);
      recommendations.push(...skillBasedRecs);
      
      // 2. Interest-based recommendations
      const interestBasedRecs = await this.getInterestBasedRecommendations(studentData, allCourses);
      recommendations.push(...interestBasedRecs);
      
      // 3. Collaborative filtering (similar students)
      const collaborativeRecs = await this.getCollaborativeRecommendations(studentId, allCourses);
      recommendations.push(...collaborativeRecs);
      
      // 4. Popular courses recommendations
      const popularRecs = await this.getPopularRecommendations(studentData, allCourses);
      recommendations.push(...popularRecs);
      
      // 5. Completion-based recommendations
      const completionRecs = await this.getCompletionBasedRecommendations(studentData, allCourses);
      recommendations.push(...completionRecs);
      
      // Combine and rank recommendations
      const combinedRecs = this.combineAndRankRecommendations(recommendations, limit);
      
      // Save recommendations to database
      await this.saveRecommendations(studentId, combinedRecs);
      
      return combinedRecs;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }
  
  // Get comprehensive student data for analysis
  static async getStudentData(studentId) {
    const [gamification, enrollments, progress] = await Promise.all([
      StudentGamification.findOne({ student: studentId }),
      Enrollment.find({ student: studentId }).populate('course'),
      Progress.find({ student: studentId })
    ]);
    
    return {
      gamification: gamification || {},
      enrollments: enrollments || [],
      progress: progress || [],
      completedCourses: enrollments.filter(e => e.completed).map(e => e.course._id),
      inProgressCourses: enrollments.filter(e => !e.completed).map(e => e.course._id),
      interests: gamification?.statistics?.interests || [],
      skillLevel: this.calculateSkillLevel(gamification),
      learningPattern: this.analyzeLearningPattern(gamification, progress)
    };
  }
  
  // Calculate student's skill level based on achievements and progress
  static calculateSkillLevel(gamification) {
    if (!gamification) return 'beginner';
    
    const { statistics, level } = gamification;
    const totalCourses = statistics.coursesCompleted || 0;
    const totalLectures = statistics.lecturesCompleted || 0;
    const averageScore = statistics.averageScore || 0;
    
    if (level >= 20 && totalCourses >= 20 && averageScore >= 90) return 'expert';
    if (level >= 10 && totalCourses >= 10 && averageScore >= 80) return 'advanced';
    if (level >= 5 && totalCourses >= 5 && averageScore >= 70) return 'intermediate';
    return 'beginner';
  }
  
  // Analyze learning patterns and preferences
  static analyzeLearningPattern(gamification, progress) {
    if (!gamification) return {};
    
    const { statistics } = gamification;
    
    return {
      preferredTime: this.getPreferredLearningTime(statistics),
      preferredDuration: this.getPreferredSessionDuration(statistics),
      preferredDifficulty: this.getPreferredDifficulty(statistics),
      socialLearner: (statistics.socialInteractions || 0) > 10,
      completionRate: this.calculateCompletionRate(statistics),
      learningSpeed: this.calculateLearningSpeed(statistics)
    };
  }
  
  // Get preferred learning time based on statistics
  static getPreferredLearningTime(statistics) {
    const earlyBird = statistics.earlyBirdSessions || 0;
    const nightOwl = statistics.nightOwlSessions || 0;
    const weekend = statistics.weekendSessions || 0;
    
    if (earlyBird > nightOwl && earlyBird > weekend) return 'morning';
    if (nightOwl > earlyBird && nightOwl > weekend) return 'evening';
    if (weekend > earlyBird && weekend > nightOwl) return 'weekend';
    return 'flexible';
  }
  
  // Get preferred session duration
  static getPreferredSessionDuration(statistics) {
    const avgSession = statistics.averageSessionLength || 0;
    if (avgSession < 30) return 'short';
    if (avgSession < 90) return 'medium';
    return 'long';
  }
  
  // Get preferred difficulty level
  static getPreferredDifficulty(statistics) {
    const avgScore = statistics.averageScore || 0;
    if (avgScore >= 90) return 'challenging';
    if (avgScore >= 70) return 'moderate';
    return 'easy';
  }
  
  // Calculate completion rate
  static calculateCompletionRate(statistics) {
    const started = statistics.coursesStarted || 0;
    const completed = statistics.coursesCompleted || 0;
    return started > 0 ? (completed / started) * 100 : 0;
  }
  
  // Calculate learning speed
  static calculateLearningSpeed(statistics) {
    const totalTime = statistics.totalTimeSpent || 0;
    const lectures = statistics.lecturesCompleted || 0;
    return lectures > 0 ? totalTime / lectures : 0;
  }
  
  // Skill-based recommendations
  static async getSkillBasedRecommendations(studentData, allCourses) {
    const { skillLevel, completedCourses } = studentData;
    const recommendations = [];
    
    for (const course of allCourses) {
      if (completedCourses.includes(course._id)) continue;
      
      let score = 0;
      let reason = '';
      
      // Match skill level
      if (course.difficulty === skillLevel) {
        score += 30;
        reason = `Perfect for your ${skillLevel} skill level`;
      } else if (this.isSkillLevelAppropriate(skillLevel, course.difficulty)) {
        score += 20;
        reason = `Good progression from ${skillLevel} to ${course.difficulty}`;
      }
      
      // Check prerequisites
      if (this.meetsPrerequisites(completedCourses, course.prerequisites)) {
        score += 25;
        reason += reason ? ' and you meet all prerequisites' : 'You meet all prerequisites';
      }
      
      if (score > 0) {
        recommendations.push({
          course,
          score,
          reason,
          category: 'skill_gap',
          factors: {
            skillLevel: course.difficulty,
            prerequisites: course.prerequisites || []
          }
        });
      }
    }
    
    return recommendations;
  }
  
  // Interest-based recommendations
  static async getInterestBasedRecommendations(studentData, allCourses) {
    const { interests, completedCourses } = studentData;
    const recommendations = [];
    
    for (const course of allCourses) {
      if (completedCourses.includes(course._id)) continue;
      
      let score = 0;
      let reason = '';
      
      // Match interests
      const courseTags = course.tags || [];
      const interestMatches = interests.filter(interest => 
        courseTags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
      );
      
      if (interestMatches.length > 0) {
        score += interestMatches.length * 15;
        reason = `Matches your interests: ${interestMatches.join(', ')}`;
      }
      
      // Category match
      if (interests.includes(course.category)) {
        score += 20;
        reason += reason ? ' and category preference' : 'Matches your preferred category';
      }
      
      if (score > 0) {
        recommendations.push({
          course,
          score,
          reason,
          category: 'interest_match',
          factors: {
            interests: interestMatches,
            tags: courseTags
          }
        });
      }
    }
    
    return recommendations;
  }
  
  // Collaborative filtering recommendations
  static async getCollaborativeRecommendations(studentId, allCourses) {
    const recommendations = [];
    
    // Find similar students (simplified collaborative filtering)
    const similarStudents = await this.findSimilarStudents(studentId);
    
    for (const course of allCourses) {
      let score = 0;
      let reason = '';
      
      // Check if similar students liked this course
      const similarStudentEnrollments = await Enrollment.find({
        student: { $in: similarStudents },
        course: course._id
      });
      
      if (similarStudentEnrollments.length > 0) {
        const avgRating = similarStudentEnrollments.reduce((sum, e) => sum + (e.rating || 0), 0) / similarStudentEnrollments.length;
        score = Math.min(avgRating * 10, 40);
        reason = `Students like you enjoyed this course (${avgRating.toFixed(1)}/5 rating)`;
      }
      
      if (score > 0) {
        recommendations.push({
          course,
          score,
          reason,
          category: 'collaborative',
          factors: {
            averageRating: avgRating,
            similarStudentCount: similarStudentEnrollments.length
          }
        });
      }
    }
    
    return recommendations;
  }
  
  // Find students with similar learning patterns
  static async findSimilarStudents(studentId) {
    const studentGamification = await StudentGamification.findOne({ student: studentId });
    if (!studentGamification) return [];
    
    const { level, statistics } = studentGamification;
    
    // Find students with similar level and interests
    const similarStudents = await StudentGamification.find({
      student: { $ne: studentId },
      level: { $gte: level - 2, $lte: level + 2 },
      'statistics.interests': { $in: statistics.interests || [] }
    }).limit(10);
    
    return similarStudents.map(s => s.student);
  }
  
  // Popular courses recommendations
  static async getPopularRecommendations(studentData, allCourses) {
    const { completedCourses } = studentData;
    const recommendations = [];
    
    for (const course of allCourses) {
      if (completedCourses.includes(course._id)) continue;
      
      let score = 0;
      let reason = '';
      
      // High enrollment count
      const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
      if (enrollmentCount > 100) {
        score += 20;
        reason = `Popular course with ${enrollmentCount} students`;
      }
      
      // High rating
      if (course.averageRating && course.averageRating >= 4.5) {
        score += 15;
        reason += reason ? ' and excellent ratings' : 'Highly rated course';
      }
      
      // Trending (recent enrollments)
      const recentEnrollments = await Enrollment.countDocuments({
        course: course._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });
      
      if (recentEnrollments > 20) {
        score += 10;
        reason += reason ? ' and trending' : 'Trending course';
      }
      
      if (score > 0) {
        recommendations.push({
          course,
          score,
          reason,
          category: 'popular',
          factors: {
            enrollmentCount,
            averageRating: course.averageRating,
            recentEnrollments
          }
        });
      }
    }
    
    return recommendations;
  }
  
  // Completion-based recommendations
  static async getCompletionBasedRecommendations(studentData, allCourses) {
    const { completedCourses, learningPattern } = studentData;
    const recommendations = [];
    
    for (const course of allCourses) {
      if (completedCourses.includes(course._id)) continue;
      
      let score = 0;
      let reason = '';
      
      // Match learning pattern preferences
      if (learningPattern.preferredDuration === 'short' && course.estimatedDuration <= 2) {
        score += 15;
        reason = 'Matches your preference for shorter courses';
      } else if (learningPattern.preferredDuration === 'long' && course.estimatedDuration >= 5) {
        score += 15;
        reason = 'Matches your preference for comprehensive courses';
      }
      
      // High completion rate courses
      const courseEnrollments = await Enrollment.find({ course: course._id });
      if (courseEnrollments.length > 0) {
        const completionRate = (courseEnrollments.filter(e => e.completed).length / courseEnrollments.length) * 100;
        if (completionRate >= 80) {
          score += 20;
          reason += reason ? ' and high completion rate' : 'High completion rate course';
        }
      }
      
      if (score > 0) {
        recommendations.push({
          course,
          score,
          reason,
          category: 'completion_based',
          factors: {
            estimatedDuration: course.estimatedDuration,
            completionRate
          }
        });
      }
    }
    
    return recommendations;
  }
  
  // Combine and rank all recommendations
  static combineAndRankRecommendations(recommendations, limit) {
    const courseScores = new Map();
    
    // Combine scores for the same course
    for (const rec of recommendations) {
      const courseId = rec.course._id.toString();
      if (!courseScores.has(courseId)) {
        courseScores.set(courseId, {
          course: rec.course,
          totalScore: 0,
          reasons: [],
          categories: [],
          factors: {}
        });
      }
      
      const existing = courseScores.get(courseId);
      existing.totalScore += rec.score;
      existing.reasons.push(rec.reason);
      existing.categories.push(rec.category);
      Object.assign(existing.factors, rec.factors);
    }
    
    // Convert to array and sort by score
    const rankedRecommendations = Array.from(courseScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((rec, index) => ({
        ...rec,
        rank: index + 1,
        primaryReason: rec.reasons[0],
        confidence: Math.min(rec.totalScore / 100, 1)
      }));
    
    return rankedRecommendations;
  }
  
  // Save recommendations to database
  static async saveRecommendations(studentId, recommendations) {
    // Clear old recommendations
    await Recommendation.deleteMany({ student: studentId });
    
    // Save new recommendations
    const recommendationDocs = recommendations.map(rec => ({
      student: studentId,
      course: rec.course._id,
      score: rec.totalScore,
      reason: rec.primaryReason,
      category: rec.categories[0],
      factors: rec.factors,
      metadata: {
        algorithm: 'hybrid',
        confidence: rec.confidence,
        rank: rec.rank
      }
    }));
    
    await Recommendation.insertMany(recommendationDocs);
  }
  
  // Get recommendations for a student
  static async getRecommendations(studentId, limit = 10) {
    try {
      let recommendations = await Recommendation.find({ 
        student: studentId, 
        isActive: true 
      })
      .populate('course', 'title description thumbnail category difficulty price isFree')
      .populate('course.tutor', 'firstName lastName')
      .sort({ score: -1 })
      .limit(limit);
      
      // If no recommendations exist or they're old, generate new ones
      if (recommendations.length === 0 || this.areRecommendationsStale(recommendations)) {
        await this.generateRecommendations(studentId, limit);
        recommendations = await Recommendation.find({ 
          student: studentId, 
          isActive: true 
        })
        .populate('course', 'title description thumbnail category difficulty price isFree')
        .populate('course.tutor', 'firstName lastName')
        .sort({ score: -1 })
        .limit(limit);
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
  
  // Check if recommendations are stale (older than 7 days)
  static areRecommendationsStale(recommendations) {
    if (recommendations.length === 0) return true;
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return recommendations.some(rec => rec.metadata.lastUpdated < sevenDaysAgo);
  }
  
  // Helper methods
  static isSkillLevelAppropriate(currentLevel, targetLevel) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(targetLevel);
    return targetIndex <= currentIndex + 1;
  }
  
  static meetsPrerequisites(completedCourses, prerequisites) {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(prereq => completedCourses.includes(prereq));
  }
}

module.exports = RecommendationService; 