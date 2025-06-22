const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  domain: {
    type: String,
    required: [true, 'Organization domain is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  logo: {
    filename: String,
    originalName: String,
    contentType: String,
    path: String,
    size: Number
  },
  primaryColor: {
    type: String,
    default: '#3B82F6',
    validate: {
      validator: function(value) {
        return /^#[0-9A-F]{6}$/i.test(value);
      },
      message: 'Primary color must be a valid hex color'
    }
  },
  secondaryColor: {
    type: String,
    default: '#1F2937',
    validate: {
      validator: function(value) {
        return /^#[0-9A-F]{6}$/i.test(value);
      },
      message: 'Secondary color must be a valid hex color'
    }
  },
  customBranding: {
    favicon: {
      filename: String,
      originalName: String,
      contentType: String,
      path: String,
      size: Number
    },
    customCSS: String,
    customJS: String,
    footerText: String,
    headerText: String
  },
  ssoConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['saml', 'oauth2', 'ldap', 'azure', 'google'],
      default: 'saml'
    },
    config: {
      // SAML Configuration
      entryPoint: String,
      issuer: String,
      cert: String,
      // OAuth2 Configuration
      clientId: String,
      clientSecret: String,
      authorizationURL: String,
      tokenURL: String,
      // LDAP Configuration
      ldapUrl: String,
      bindDN: String,
      bindCredentials: String,
      searchBase: String,
      searchFilter: String
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'professional', 'enterprise'],
      default: 'basic'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    maxUsers: {
      type: Number,
      default: 100
    },
    features: {
      sso: {
        type: Boolean,
        default: false
      },
      customBranding: {
        type: Boolean,
        default: false
      },
      advancedAnalytics: {
        type: Boolean,
        default: false
      },
      apiAccess: {
        type: Boolean,
        default: false
      },
      prioritySupport: {
        type: Boolean,
        default: false
      }
    }
  },
  contact: {
    primaryContact: {
      name: String,
      email: String,
      phone: String,
      role: String
    },
    billingContact: {
      name: String,
      email: String,
      phone: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  settings: {
    allowPublicCourses: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoEnrollment: {
      type: Boolean,
      default: false
    },
    defaultRole: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for domain lookups
organizationSchema.index({ domain: 1 });

module.exports = mongoose.model('Organization', organizationSchema); 