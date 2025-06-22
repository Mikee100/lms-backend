const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const LearningPath = require('../models/LearningPath');
const EnterpriseAnalytics = require('../models/EnterpriseAnalytics');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Tutor = require('../models/Tutor');
require('dotenv').config();

const sampleOrganizations = [
  {
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    description: 'Leading technology solutions provider specializing in software development and digital transformation.',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    subscription: {
      plan: 'enterprise',
      maxUsers: 1000,
      features: {
        sso: true,
        customBranding: true,
        advancedAnalytics: true,
        apiAccess: true,
        prioritySupport: true
      }
    },
    contact: {
      primaryContact: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        phone: '+1-555-0123',
        role: 'Learning & Development Manager'
      },
      billingContact: {
        name: 'Mike Chen',
        email: 'mike.chen@techcorp.com',
        phone: '+1-555-0124'
      },
      address: {
        street: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      }
    }
  },
  {
    name: 'Global Manufacturing Inc.',
    domain: 'globalmanufacturing.com',
    description: 'International manufacturing company with operations in 15 countries.',
    primaryColor: '#10B981',
    secondaryColor: '#065F46',
    subscription: {
      plan: 'professional',
      maxUsers: 500,
      features: {
        sso: true,
        customBranding: true,
        advancedAnalytics: true,
        apiAccess: false,
        prioritySupport: true
      }
    },
    contact: {
      primaryContact: {
        name: 'David Rodriguez',
        email: 'david.rodriguez@globalmanufacturing.com',
        phone: '+1-555-0125',
        role: 'Training Director'
      },
      billingContact: {
        name: 'Lisa Wang',
        email: 'lisa.wang@globalmanufacturing.com',
        phone: '+1-555-0126'
      },
      address: {
        street: '456 Industrial Blvd',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        country: 'USA'
      }
    }
  },
  {
    name: 'Healthcare Partners',
    domain: 'healthcarepartners.org',
    description: 'Healthcare organization focused on patient care and medical training.',
    primaryColor: '#EF4444',
    secondaryColor: '#7F1D1D',
    subscription: {
      plan: 'enterprise',
      maxUsers: 2000,
      features: {
        sso: true,
        customBranding: true,
        advancedAnalytics: true,
        apiAccess: true,
        prioritySupport: true
      }
    },
    contact: {
      primaryContact: {
        name: 'Dr. Emily Thompson',
        email: 'emily.thompson@healthcarepartners.org',
        phone: '+1-555-0127',
        role: 'Chief Medical Officer'
      },
      billingContact: {
        name: 'Robert Kim',
        email: 'robert.kim@healthcarepartners.org',
        phone: '+1-555-0128'
      },
      address: {
        street: '789 Medical Center Way',
        city: 'Boston',
        state: 'MA',
        zipCode: '02108',
        country: 'USA'
      }
    }
  }
];

const sampleLearningPaths = [
  {
    title: 'Full Stack Web Development',
    description: 'Comprehensive learning path for becoming a full-stack web developer with modern technologies.',
    category: 'technical',
    level: 'intermediate',
    estimatedDuration: { hours: 120, weeks: 12 },
    requirements: {
      skills: ['HTML', 'CSS', 'JavaScript'],
      experience: 'Basic programming knowledge',
      certifications: []
    },
    outcomes: {
      skills: ['React', 'Node.js', 'MongoDB', 'Express.js'],
      certifications: ['Full Stack Developer Certificate'],
      competencies: ['Web Development', 'API Design', 'Database Management']
    },
    assessment: {
      type: 'project',
      passingScore: 80,
      maxAttempts: 2
    },
    visibility: 'organization',
    tags: ['web-development', 'javascript', 'react', 'nodejs']
  },
  {
    title: 'Leadership Excellence Program',
    description: 'Develop essential leadership skills for managing teams and driving organizational success.',
    category: 'leadership',
    level: 'advanced',
    estimatedDuration: { hours: 80, weeks: 8 },
    requirements: {
      skills: ['Communication', 'Team Management'],
      experience: '2+ years in management role',
      certifications: []
    },
    outcomes: {
      skills: ['Strategic Thinking', 'Conflict Resolution', 'Change Management'],
      certifications: ['Leadership Excellence Certificate'],
      competencies: ['Team Leadership', 'Strategic Planning', 'Performance Management']
    },
    assessment: {
      type: 'presentation',
      passingScore: 75,
      maxAttempts: 3
    },
    visibility: 'organization',
    tags: ['leadership', 'management', 'strategy']
  },
  {
    title: 'Cybersecurity Fundamentals',
    description: 'Essential cybersecurity training for protecting organizational data and systems.',
    category: 'compliance',
    level: 'beginner',
    estimatedDuration: { hours: 60, weeks: 6 },
    requirements: {
      skills: ['Basic Computer Skills'],
      experience: 'No prior experience required',
      certifications: []
    },
    outcomes: {
      skills: ['Security Awareness', 'Threat Detection', 'Incident Response'],
      certifications: ['Cybersecurity Fundamentals Certificate'],
      competencies: ['Security Best Practices', 'Risk Assessment', 'Compliance']
    },
    assessment: {
      type: 'quiz',
      passingScore: 85,
      maxAttempts: 3
    },
    visibility: 'organization',
    tags: ['cybersecurity', 'compliance', 'security']
  },
  {
    title: 'Sales Excellence Training',
    description: 'Comprehensive sales training program to improve performance and close more deals.',
    category: 'sales',
    level: 'intermediate',
    estimatedDuration: { hours: 90, weeks: 10 },
    requirements: {
      skills: ['Communication', 'Customer Service'],
      experience: '1+ years in sales',
      certifications: []
    },
    outcomes: {
      skills: ['Prospecting', 'Negotiation', 'CRM Management'],
      certifications: ['Sales Excellence Certificate'],
      competencies: ['Sales Process', 'Customer Relationship Management', 'Revenue Generation']
    },
    assessment: {
      type: 'project',
      passingScore: 80,
      maxAttempts: 2
    },
    visibility: 'organization',
    tags: ['sales', 'negotiation', 'customer-relationship']
  }
];

const sampleAnalytics = [
  {
    metrics: {
      totalUsers: 1250,
      activeUsers: {
        daily: 450,
        weekly: 850,
        monthly: 1100
      },
      newUsers: 45,
      churnRate: 2.5,
      totalCourses: 85,
      completedCourses: 680,
      averageCompletionRate: 78.5,
      averageCourseRating: 4.2,
      totalLearningPaths: 12,
      activeLearningPaths: 10,
      learningPathCompletions: 156,
      totalLearningHours: 2840,
      averageSessionDuration: 45,
      averageTimeToComplete: 8.5,
      totalAssessments: 320,
      averageAssessmentScore: 82.3,
      passRate: 89.7,
      trainingCost: 125000,
      productivityImprovement: 23.5,
      retentionRate: 94.2
    },
    breakdowns: {
      byCategory: [
        { category: 'Technical', enrollments: 450, completions: 380, averageScore: 85.2, averageTime: 6.2 },
        { category: 'Leadership', enrollments: 280, completions: 220, averageScore: 88.1, averageTime: 8.1 },
        { category: 'Sales', enrollments: 320, completions: 280, averageScore: 82.5, averageTime: 7.3 },
        { category: 'Compliance', enrollments: 200, completions: 195, averageScore: 90.1, averageTime: 4.8 }
      ],
      byLevel: [
        { level: 'beginner', enrollments: 380, completions: 320, averageScore: 85.5 },
        { level: 'intermediate', enrollments: 520, completions: 420, averageScore: 83.2 },
        { level: 'advanced', enrollments: 350, completions: 280, averageScore: 87.8 }
      ]
    },
    customKPIs: [
      { name: 'Employee Satisfaction', value: 4.3, target: 4.5, unit: 'stars', trend: 'increasing' },
      { name: 'Training ROI', value: 285, target: 250, unit: '%', trend: 'increasing' },
      { name: 'Skill Gap Reduction', value: 67, target: 75, unit: '%', trend: 'increasing' }
    ],
    alerts: [
      {
        type: 'low-engagement',
        severity: 'medium',
        message: 'Sales team engagement dropped 15% this month',
        triggeredAt: new Date(),
        resolved: false
      }
    ]
  }
];

async function seedEnterpriseData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Organization.deleteMany({});
    await LearningPath.deleteMany({});
    await EnterpriseAnalytics.deleteMany({});
    console.log('Cleared existing enterprise data');

    // Create organizations
    const organizations = await Organization.insertMany(sampleOrganizations);
    console.log(`Created ${organizations.length} organizations`);

    // Get some existing tutors and courses for learning paths
    const tutors = await Tutor.find().limit(5);
    const courses = await Course.find().limit(10);

    if (tutors.length === 0 || courses.length === 0) {
      console.log('No tutors or courses found. Please seed basic data first.');
      return;
    }

    // Create learning paths for each organization
    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const orgLearningPaths = sampleLearningPaths.map((path, index) => ({
        ...path,
        organization: org._id,
        createdBy: tutors[i % tutors.length]._id,
        courses: courses.slice(index * 2, (index + 1) * 2).map((course, courseIndex) => ({
          course: course._id,
          order: courseIndex + 1,
          isRequired: true,
          prerequisites: []
        }))
      }));

      await LearningPath.insertMany(orgLearningPaths);
      console.log(`Created ${orgLearningPaths.length} learning paths for ${org.name}`);
    }

    // Create analytics for each organization
    for (const org of organizations) {
      const analytics = sampleAnalytics.map(analytic => ({
        ...analytic,
        organization: org._id,
        date: new Date()
      }));

      await EnterpriseAnalytics.insertMany(analytics);
      console.log(`Created analytics for ${org.name}`);
    }

    // Update some existing students to belong to organizations
    const students = await Student.find().limit(50);
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
    const jobTitles = ['Software Engineer', 'Sales Representative', 'Marketing Specialist', 'HR Coordinator', 'Financial Analyst', 'Operations Manager'];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const orgIndex = i % organizations.length;
      
      await Student.findByIdAndUpdate(student._id, {
        organization: organizations[orgIndex]._id,
        department: departments[i % departments.length],
        jobTitle: jobTitles[i % jobTitles.length],
        employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
        hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
      });
    }
    console.log(`Updated ${students.length} students with organization data`);

    // Update some courses to belong to organizations
    const orgCourses = courses.slice(0, 15);
    for (let i = 0; i < orgCourses.length; i++) {
      const course = orgCourses[i];
      const orgIndex = i % organizations.length;
      
      await Course.findByIdAndUpdate(course._id, {
        organization: organizations[orgIndex]._id,
        visibility: 'organization',
        compliance: {
          isComplianceCourse: Math.random() > 0.7, // 30% chance of being compliance course
          complianceType: ['safety', 'security', 'hr', 'legal', 'industry'][Math.floor(Math.random() * 5)],
          expiryPeriod: 12
        },
        assessment: {
          hasAssessment: Math.random() > 0.5,
          passingScore: 70 + Math.floor(Math.random() * 20),
          maxAttempts: 3,
          certificateOnCompletion: Math.random() > 0.6
        }
      });
    }
    console.log(`Updated ${orgCourses.length} courses with organization data`);

    console.log('Enterprise data seeding completed successfully!');
    console.log('\nSample Organizations:');
    organizations.forEach(org => {
      console.log(`- ${org.name} (${org.domain})`);
    });

  } catch (error) {
    console.error('Error seeding enterprise data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedEnterpriseData();
}

module.exports = seedEnterpriseData; 