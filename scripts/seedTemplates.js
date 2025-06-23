const mongoose = require('mongoose');
const CourseTemplate = require('../models/CourseTemplate');
require('dotenv').config();

const templates = [
  {
    name: "Introduction to Web Development",
    description: "A comprehensive course covering HTML, CSS, and JavaScript fundamentals for beginners",
    subject: "Computer Science",
    level: "beginner",
    estimatedDuration: {
      hours: 40,
      weeks: 8
    },
    structure: {
      sections: [
        {
          title: "HTML Fundamentals",
          description: "Learn the basics of HTML markup",
          order: 1,
          estimatedDuration: { hours: 8, minutes: 0 },
          lectures: [
            {
              title: "Introduction to HTML",
              description: "Understanding HTML structure and elements",
              order: 1,
              type: "video",
              estimatedDuration: 45,
              materials: [
                {
                  type: "pdf",
                  name: "HTML Cheat Sheet",
                  description: "Quick reference for HTML tags",
                  required: true
                }
              ]
            },
            {
              title: "HTML Forms and Input",
              description: "Creating interactive forms with HTML",
              order: 2,
              type: "video",
              estimatedDuration: 60,
              materials: [
                {
                  type: "pdf",
                  name: "Form Validation Guide",
                  description: "Best practices for form validation",
                  required: false
                }
              ]
            }
          ],
          assessments: [
            {
              title: "HTML Quiz",
              type: "quiz",
              weight: 15,
              instructions: "Test your understanding of HTML fundamentals"
            }
          ]
        },
        {
          title: "CSS Styling",
          description: "Learn to style web pages with CSS",
          order: 2,
          estimatedDuration: { hours: 12, minutes: 0 },
          lectures: [
            {
              title: "CSS Basics",
              description: "Introduction to CSS selectors and properties",
              order: 1,
              type: "video",
              estimatedDuration: 50,
              materials: []
            },
            {
              title: "CSS Layout",
              description: "Understanding Flexbox and Grid",
              order: 2,
              type: "video",
              estimatedDuration: 75,
              materials: []
            }
          ],
          assessments: [
            {
              title: "CSS Project",
              type: "project",
              weight: 25,
              instructions: "Create a responsive website using HTML and CSS"
            }
          ]
        }
      ]
    },
    learningObjectives: [
      "Understand HTML document structure",
      "Create responsive web layouts with CSS",
      "Write basic JavaScript functionality",
      "Build a complete website from scratch"
    ],
    prerequisites: [
      "Basic computer literacy",
      "No prior programming experience required"
    ],
    outcomes: [
      "Ability to create static websites",
      "Understanding of web development workflow",
      "Foundation for advanced web technologies"
    ],
    tags: ["web development", "html", "css", "javascript", "beginner"],
    isPublic: true,
    status: "published",
    usageCount: 150,
    rating: {
      average: 4.5,
      count: 89
    }
  },
  {
    name: "Data Science Fundamentals",
    description: "Learn the basics of data analysis, statistics, and machine learning",
    subject: "Computer Science",
    level: "intermediate",
    estimatedDuration: {
      hours: 60,
      weeks: 12
    },
    structure: {
      sections: [
        {
          title: "Python for Data Science",
          description: "Master Python programming for data analysis",
          order: 1,
          estimatedDuration: { hours: 15, minutes: 0 },
          lectures: [
            {
              title: "Python Basics",
              description: "Essential Python programming concepts",
              order: 1,
              type: "video",
              estimatedDuration: 90,
              materials: []
            },
            {
              title: "Pandas Library",
              description: "Data manipulation and analysis with Pandas",
              order: 2,
              type: "video",
              estimatedDuration: 120,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Python Coding Assignment",
              type: "assignment",
              weight: 20,
              instructions: "Complete data manipulation tasks using Python"
            }
          ]
        },
        {
          title: "Statistical Analysis",
          description: "Learn statistical concepts and their applications",
          order: 2,
          estimatedDuration: { hours: 20, minutes: 0 },
          lectures: [
            {
              title: "Descriptive Statistics",
              description: "Understanding data distributions and summaries",
              order: 1,
              type: "video",
              estimatedDuration: 80,
              materials: []
            },
            {
              title: "Inferential Statistics",
              description: "Hypothesis testing and confidence intervals",
              order: 2,
              type: "video",
              estimatedDuration: 100,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Statistical Analysis Project",
              type: "project",
              weight: 30,
              instructions: "Analyze a real dataset using statistical methods"
            }
          ]
        }
      ]
    },
    learningObjectives: [
      "Master Python for data analysis",
      "Understand statistical concepts",
      "Apply machine learning algorithms",
      "Create data visualizations"
    ],
    prerequisites: [
      "Basic programming knowledge",
      "High school mathematics"
    ],
    outcomes: [
      "Ability to analyze complex datasets",
      "Understanding of statistical methods",
      "Foundation for machine learning"
    ],
    tags: ["data science", "python", "statistics", "machine learning", "pandas"],
    isPublic: true,
    status: "published",
    usageCount: 89,
    rating: {
      average: 4.7,
      count: 67
    }
  },
  {
    name: "Business Strategy and Management",
    description: "Develop strategic thinking and management skills for business success",
    subject: "Business",
    level: "intermediate",
    estimatedDuration: {
      hours: 50,
      weeks: 10
    },
    structure: {
      sections: [
        {
          title: "Strategic Planning",
          description: "Learn to develop and implement business strategies",
          order: 1,
          estimatedDuration: { hours: 12, minutes: 0 },
          lectures: [
            {
              title: "Strategic Analysis",
              description: "SWOT analysis and competitive positioning",
              order: 1,
              type: "video",
              estimatedDuration: 70,
              materials: []
            },
            {
              title: "Strategy Formulation",
              description: "Developing strategic options and choices",
              order: 2,
              type: "video",
              estimatedDuration: 80,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Strategic Plan",
              type: "project",
              weight: 25,
              instructions: "Create a strategic plan for a business case"
            }
          ]
        },
        {
          title: "Leadership and Management",
          description: "Develop leadership skills and management techniques",
          order: 2,
          estimatedDuration: { hours: 15, minutes: 0 },
          lectures: [
            {
              title: "Leadership Styles",
              description: "Understanding different leadership approaches",
              order: 1,
              type: "video",
              estimatedDuration: 60,
              materials: []
            },
            {
              title: "Team Management",
              description: "Building and managing effective teams",
              order: 2,
              type: "video",
              estimatedDuration: 75,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Leadership Assessment",
              type: "assignment",
              weight: 20,
              instructions: "Analyze leadership case studies"
            }
          ]
        }
      ]
    },
    learningObjectives: [
      "Develop strategic thinking skills",
      "Understand business management principles",
      "Learn effective leadership techniques",
      "Master organizational strategy"
    ],
    prerequisites: [
      "Basic business knowledge",
      "Interest in management"
    ],
    outcomes: [
      "Ability to develop business strategies",
      "Enhanced leadership skills",
      "Understanding of organizational management"
    ],
    tags: ["business", "strategy", "management", "leadership", "planning"],
    isPublic: true,
    status: "published",
    usageCount: 234,
    rating: {
      average: 4.6,
      count: 156
    }
  },
  {
    name: "Digital Marketing Mastery",
    description: "Comprehensive guide to modern digital marketing strategies and tools",
    subject: "Marketing",
    level: "beginner",
    estimatedDuration: {
      hours: 45,
      weeks: 9
    },
    structure: {
      sections: [
        {
          title: "Marketing Fundamentals",
          description: "Understanding the basics of marketing in the digital age",
          order: 1,
          estimatedDuration: { hours: 10, minutes: 0 },
          lectures: [
            {
              title: "Marketing Mix",
              description: "The 4Ps and 4Cs of marketing",
              order: 1,
              type: "video",
              estimatedDuration: 55,
              materials: []
            },
            {
              title: "Customer Journey",
              description: "Mapping the customer experience",
              order: 2,
              type: "video",
              estimatedDuration: 65,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Marketing Analysis",
              type: "assignment",
              weight: 15,
              instructions: "Analyze a company's marketing strategy"
            }
          ]
        },
        {
          title: "Digital Channels",
          description: "Master various digital marketing channels",
          order: 2,
          estimatedDuration: { hours: 20, minutes: 0 },
          lectures: [
            {
              title: "Social Media Marketing",
              description: "Strategies for social media platforms",
              order: 1,
              type: "video",
              estimatedDuration: 90,
              materials: []
            },
            {
              title: "Email Marketing",
              description: "Building effective email campaigns",
              order: 2,
              type: "video",
              estimatedDuration: 75,
              materials: []
            }
          ],
          assessments: [
            {
              title: "Digital Campaign",
              type: "project",
              weight: 30,
              instructions: "Create a complete digital marketing campaign"
            }
          ]
        }
      ]
    },
    learningObjectives: [
      "Understand digital marketing principles",
      "Master social media marketing",
      "Learn email marketing strategies",
      "Create effective marketing campaigns"
    ],
    prerequisites: [
      "Basic computer skills",
      "Interest in marketing"
    ],
    outcomes: [
      "Ability to create digital marketing campaigns",
      "Understanding of marketing analytics",
      "Skills in social media management"
    ],
    tags: ["marketing", "digital", "social media", "email", "campaigns"],
    isPublic: true,
    status: "published",
    usageCount: 567,
    rating: {
      average: 4.8,
      count: 423
    }
  }
];

async function seedTemplates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing templates
    await CourseTemplate.deleteMany({});
    console.log('Cleared existing templates');

    // Insert new templates
    const createdTemplates = await CourseTemplate.insertMany(templates);
    console.log(`Created ${createdTemplates.length} templates`);

    console.log('Template seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

seedTemplates(); 