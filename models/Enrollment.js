const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    required: true,
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentDate: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed'],
    default: 'pending'
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
