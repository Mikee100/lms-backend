const mongoose = require('mongoose');
const Achievement = require('../models/Achievement');
require('dotenv').config();

const achievements = [
  // === BEGINNER ACHIEVEMENTS ===
  {
    name: "First Steps",
    description: "Complete your first lecture",
    icon: "🎯",
    category: "learning",
    subcategory: "beginner",
    criteria: { type: "lectures_completed", threshold: 1, timeFrame: "lifetime" },
    pointsReward: 50,
    experienceReward: 25,
    rarity: "common",
    difficulty: "easy"
  },
  {
    name: "Course Explorer",
    description: "Enroll in your first course",
    icon: "📚",
    category: "learning",
    subcategory: "beginner",
    criteria: { type: "courses_completed", threshold: 1, timeFrame: "lifetime" },
    pointsReward: 100,
    experienceReward: 50,
    rarity: "common",
    difficulty: "easy"
  },
  {
    name: "Profile Pioneer",
    description: "Complete 50% of your profile",
    icon: "👤",
    category: "milestone",
    subcategory: "beginner",
    criteria: { type: "profile_completion", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 75,
    experienceReward: 25,
    rarity: "common",
    difficulty: "easy"
  },
  {
    name: "Social Butterfly",
    description: "Participate in your first social interaction",
    icon: "🦋",
    category: "social",
    subcategory: "beginner",
    criteria: { type: "social_interactions", threshold: 1, timeFrame: "lifetime" },
    pointsReward: 25,
    experienceReward: 15,
    rarity: "common",
    difficulty: "easy"
  },

  // === INTERMEDIATE ACHIEVEMENTS ===
  {
    name: "Lecture Master",
    description: "Complete 10 lectures",
    icon: "📖",
    category: "learning",
    subcategory: "intermediate",
    criteria: { type: "lectures_completed", threshold: 10, timeFrame: "lifetime" },
    pointsReward: 200,
    experienceReward: 100,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Course Champion",
    description: "Complete 5 courses",
    icon: "🏆",
    category: "learning",
    subcategory: "intermediate",
    criteria: { type: "courses_completed", threshold: 5, timeFrame: "lifetime" },
    pointsReward: 500,
    experienceReward: 250,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Week Warrior",
    description: "Maintain a 7-day learning streak",
    icon: "🔥",
    category: "streak",
    subcategory: "intermediate",
    criteria: { type: "streak_days", threshold: 7, timeFrame: "lifetime" },
    pointsReward: 300,
    experienceReward: 150,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Assignment Ace",
    description: "Submit 10 assignments",
    icon: "📝",
    category: "learning",
    subcategory: "intermediate",
    criteria: { type: "assignments_submitted", threshold: 10, timeFrame: "lifetime" },
    pointsReward: 250,
    experienceReward: 125,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Perfect Score",
    description: "Get a perfect score on an assignment",
    icon: "💯",
    category: "accuracy",
    subcategory: "intermediate",
    criteria: { type: "perfect_scores", threshold: 1, timeFrame: "lifetime" },
    pointsReward: 400,
    experienceReward: 200,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Point Collector",
    description: "Earn 1,000 points",
    icon: "💰",
    category: "milestone",
    subcategory: "intermediate",
    criteria: { type: "points_earned", threshold: 1000, timeFrame: "lifetime" },
    pointsReward: 100,
    experienceReward: 50,
    rarity: "uncommon",
    difficulty: "medium"
  },

  // === ADVANCED ACHIEVEMENTS ===
  {
    name: "Month Master",
    description: "Maintain a 30-day learning streak",
    icon: "📅",
    category: "streak",
    subcategory: "advanced",
    criteria: { type: "streak_days", threshold: 30, timeFrame: "lifetime" },
    pointsReward: 1000,
    experienceReward: 500,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Course Connoisseur",
    description: "Complete 15 courses",
    icon: "🎓",
    category: "learning",
    subcategory: "advanced",
    criteria: { type: "courses_completed", threshold: 15, timeFrame: "lifetime" },
    pointsReward: 1500,
    experienceReward: 750,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Perfect Performer",
    description: "Get 10 perfect scores",
    icon: "⭐",
    category: "accuracy",
    subcategory: "advanced",
    criteria: { type: "perfect_scores", threshold: 10, timeFrame: "lifetime" },
    pointsReward: 2000,
    experienceReward: 1000,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Point Prodigy",
    description: "Earn 10,000 points",
    icon: "💎",
    category: "milestone",
    subcategory: "advanced",
    criteria: { type: "points_earned", threshold: 10000, timeFrame: "lifetime" },
    pointsReward: 500,
    experienceReward: 250,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Community Champion",
    description: "Participate in 50 social interactions",
    icon: "🤝",
    category: "community",
    subcategory: "advanced",
    criteria: { type: "social_interactions", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 800,
    experienceReward: 400,
    rarity: "rare",
    difficulty: "hard"
  },

  // === EXPERT ACHIEVEMENTS ===
  {
    name: "Streak Legend",
    description: "Maintain a 100-day learning streak",
    icon: "👑",
    category: "streak",
    subcategory: "expert",
    criteria: { type: "streak_days", threshold: 100, timeFrame: "lifetime" },
    pointsReward: 5000,
    experienceReward: 2500,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Course Master",
    description: "Complete 50 courses",
    icon: "🎯",
    category: "mastery",
    subcategory: "expert",
    criteria: { type: "courses_completed", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 10000,
    experienceReward: 5000,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Point Master",
    description: "Earn 100,000 points",
    icon: "🏆",
    category: "milestone",
    subcategory: "expert",
    criteria: { type: "points_earned", threshold: 100000, timeFrame: "lifetime" },
    pointsReward: 2000,
    experienceReward: 1000,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Perfect Master",
    description: "Get 50 perfect scores",
    icon: "🌟",
    category: "accuracy",
    subcategory: "expert",
    criteria: { type: "perfect_scores", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 10000,
    experienceReward: 5000,
    rarity: "epic",
    difficulty: "expert"
  },

  // === TIME-BASED ACHIEVEMENTS ===
  {
    name: "Early Bird",
    description: "Complete 10 lectures before 8 AM",
    icon: "🌅",
    category: "speed",
    subcategory: "daily",
    criteria: { type: "early_bird", threshold: 10, timeFrame: "lifetime" },
    pointsReward: 300,
    experienceReward: 150,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Night Owl",
    description: "Complete 10 lectures after 10 PM",
    icon: "🦉",
    category: "speed",
    subcategory: "daily",
    criteria: { type: "night_owl", threshold: 10, timeFrame: "lifetime" },
    pointsReward: 300,
    experienceReward: 150,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Weekend Warrior",
    description: "Complete 20 lectures on weekends",
    icon: "🏃",
    category: "consistency",
    subcategory: "weekly",
    criteria: { type: "weekend_warrior", threshold: 20, timeFrame: "lifetime" },
    pointsReward: 400,
    experienceReward: 200,
    rarity: "uncommon",
    difficulty: "medium"
  },

  // === SOCIAL ACHIEVEMENTS ===
  {
    name: "Helpful Hero",
    description: "Answer 25 help requests from other students",
    icon: "🦸",
    category: "community",
    subcategory: "social_impact",
    criteria: { type: "help_others", threshold: 25, timeFrame: "lifetime" },
    pointsReward: 1000,
    experienceReward: 500,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Peer Reviewer",
    description: "Give 20 peer reviews",
    icon: "📋",
    category: "community",
    subcategory: "social_impact",
    criteria: { type: "peer_reviews", threshold: 20, timeFrame: "lifetime" },
    pointsReward: 600,
    experienceReward: 300,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Discussion Dynamo",
    description: "Participate in 30 discussions",
    icon: "💬",
    category: "social",
    subcategory: "social_impact",
    criteria: { type: "discussions_participated", threshold: 30, timeFrame: "lifetime" },
    pointsReward: 500,
    experienceReward: 250,
    rarity: "uncommon",
    difficulty: "medium"
  },

  // === ENGAGEMENT ACHIEVEMENTS ===
  {
    name: "Resource Collector",
    description: "Download 50 learning materials",
    icon: "📁",
    category: "exploration",
    subcategory: "platform_wide",
    criteria: { type: "materials_downloaded", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 400,
    experienceReward: 200,
    rarity: "uncommon",
    difficulty: "medium"
  },
  {
    name: "Bookmark Master",
    description: "Create 100 bookmarks",
    icon: "🔖",
    category: "exploration",
    subcategory: "platform_wide",
    criteria: { type: "bookmarks_created", threshold: 100, timeFrame: "lifetime" },
    pointsReward: 300,
    experienceReward: 150,
    rarity: "uncommon",
    difficulty: "medium"
  },

  // === CONSISTENCY ACHIEVEMENTS ===
  {
    name: "Consistency Champion",
    description: "Maintain 12 consecutive weeks of activity",
    icon: "📈",
    category: "consistency",
    subcategory: "monthly",
    criteria: { type: "consistency_champion", threshold: 12, timeFrame: "lifetime" },
    pointsReward: 2000,
    experienceReward: 1000,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Speed Learner",
    description: "Complete 50 lectures in under 30 minutes each",
    icon: "⚡",
    category: "speed",
    subcategory: "platform_wide",
    criteria: { type: "speed_learner", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 1500,
    experienceReward: 750,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Accuracy Master",
    description: "Maintain an average score of 95% or higher",
    icon: "🎯",
    category: "accuracy",
    subcategory: "platform_wide",
    criteria: { type: "accuracy_master", threshold: 95, timeFrame: "lifetime" },
    pointsReward: 3000,
    experienceReward: 1500,
    rarity: "epic",
    difficulty: "expert"
  },

  // === MASTERY ACHIEVEMENTS ===
  {
    name: "Course Explorer",
    description: "Start 25 different courses",
    icon: "🗺️",
    category: "exploration",
    subcategory: "platform_wide",
    criteria: { type: "explorer", threshold: 25, timeFrame: "lifetime" },
    pointsReward: 800,
    experienceReward: 400,
    rarity: "rare",
    difficulty: "hard"
  },
  {
    name: "Knowledge Master",
    description: "Complete 100 courses",
    icon: "🧠",
    category: "mastery",
    subcategory: "platform_wide",
    criteria: { type: "master", threshold: 100, timeFrame: "lifetime" },
    pointsReward: 25000,
    experienceReward: 12500,
    rarity: "legendary",
    difficulty: "master"
  },

  // === INNOVATION ACHIEVEMENTS ===
  {
    name: "Knowledge Sharer",
    description: "Share knowledge 50 times",
    icon: "💡",
    category: "innovation",
    subcategory: "social_impact",
    criteria: { type: "knowledge_sharer", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 2000,
    experienceReward: 1000,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Community Builder",
    description: "Make 100 community contributions",
    icon: "🏗️",
    category: "community",
    subcategory: "social_impact",
    criteria: { type: "community_builder", threshold: 100, timeFrame: "lifetime" },
    pointsReward: 5000,
    experienceReward: 2500,
    rarity: "legendary",
    difficulty: "master"
  },

  // === LEADERSHIP ACHIEVEMENTS ===
  {
    name: "Mentor",
    description: "Conduct 20 mentor sessions",
    icon: "👨‍🏫",
    category: "leadership",
    subcategory: "social_impact",
    criteria: { type: "mentor", threshold: 20, timeFrame: "lifetime" },
    pointsReward: 3000,
    experienceReward: 1500,
    rarity: "epic",
    difficulty: "expert"
  },
  {
    name: "Learning Leader",
    description: "Conduct 50 mentor sessions",
    icon: "👑",
    category: "leadership",
    subcategory: "social_impact",
    criteria: { type: "leader", threshold: 50, timeFrame: "lifetime" },
    pointsReward: 10000,
    experienceReward: 5000,
    rarity: "legendary",
    difficulty: "master"
  },

  // === MYTHIC ACHIEVEMENTS ===
  {
    name: "Learning Legend",
    description: "Complete 500 courses and earn 1,000,000 points",
    icon: "🌟",
    category: "mastery",
    subcategory: "platform_wide",
    criteria: { type: "courses_completed", threshold: 500, timeFrame: "lifetime" },
    pointsReward: 100000,
    experienceReward: 50000,
    rarity: "mythic",
    difficulty: "master",
    isHidden: true
  },
  {
    name: "Streak God",
    description: "Maintain a 365-day learning streak",
    icon: "🔥",
    category: "streak",
    subcategory: "platform_wide",
    criteria: { type: "streak_days", threshold: 365, timeFrame: "lifetime" },
    pointsReward: 50000,
    experienceReward: 25000,
    rarity: "mythic",
    difficulty: "master",
    isHidden: true
  },
  {
    name: "Perfect Legend",
    description: "Get 100 perfect scores",
    icon: "💎",
    category: "accuracy",
    subcategory: "platform_wide",
    criteria: { type: "perfect_scores", threshold: 100, timeFrame: "lifetime" },
    pointsReward: 50000,
    experienceReward: 25000,
    rarity: "mythic",
    difficulty: "master",
    isHidden: true
  }
];

async function seedAchievements() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing achievements
    await Achievement.deleteMany({});
    console.log('Cleared existing achievements');

    // Insert new achievements
    const createdAchievements = await Achievement.insertMany(achievements);
    console.log(`Successfully seeded ${createdAchievements.length} achievements`);

    // Log all achievements
    createdAchievements.forEach(achievement => {
      console.log(`✅ ${achievement.name} - ${achievement.description}`);
    });

    console.log('Achievement seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements(); 