const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  interests: [String],
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String
  },
  contact: {
    phone: String,
    address: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

studentProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
