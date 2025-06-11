const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const authenticateToken = require('../Middleware/authMiddleware');
const bodyParser = require('body-parser');
const authenticateTutor = require('../Middleware/auth');

// Middleware to parse raw body for webhook signature verification
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update payment and enrollment status
      try {
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (payment) {
          payment.status = 'succeeded';
          await payment.save();

          // Update enrollment payment status
          await Enrollment.findByIdAndUpdate(payment.enrollment, {
            amountPaid: payment.amount,
            paymentDate: new Date(),
            paymentStatus: 'paid'
          });
        }
      } catch (err) {
        console.error('Error updating payment/enrollment after payment_intent.succeeded:', err);
      }
      break;
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      try {
        const payment = await Payment.findOne({ stripePaymentIntentId: failedIntent.id });
        if (payment) {
          payment.status = 'failed';
          await payment.save();

          await Enrollment.findByIdAndUpdate(payment.enrollment, {
            paymentStatus: 'failed'
          });
        }
      } catch (err) {
        console.error('Error updating payment/enrollment after payment_intent.payment_failed:', err);
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Create payment intent for enrollment or section unlock
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    const { enrollmentId, amount, currency = 'usd' } = req.body;
    console.log('Creating payment intent for enrollmentId:', enrollmentId, 'amount:', amount, 'currency:', currency);

    if (!enrollmentId || !amount) {
      return res.status(400).json({ message: 'Missing enrollmentId or amount' });
    }

    // Update enrollment to pending payment status
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(enrollmentId, {
      paymentStatus: 'pending',
      amountPaid: amount,
      paymentDate: null
    }, { new: true });
    if (!updatedEnrollment) {
      console.error('Enrollment not found for update:', enrollmentId);
    } else {
      console.log('Enrollment updated to pending:', updatedEnrollment);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in cents
      currency,
      metadata: { enrollmentId }
    });

    // Save payment record
    const payment = new Payment({
      enrollment: enrollmentId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: 'pending'
    });
    await payment.save();

    res.json({ clientSecret: paymentIntent.client_secret, enrollment: updatedEnrollment });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// New endpoint to get payments for tutor's courses
router.get('/tutor-payments', authenticateTutor, async (req, res) => {
  try {
    const tutorId = req.tutor.id;

    // Find courses taught by tutor
    const courses = await Course.find({ tutor: tutorId }).select('_id');
    const courseIds = courses.map(c => c._id);

    console.log('Tutor ID:', tutorId);
    console.log('Courses found:', courseIds);

    // Find enrollments for these courses
    const enrollments = await Enrollment.find({ course: { $in: courseIds } }).select('_id student course');
    const enrollmentIds = enrollments.map(e => e._id);
    console.log('Enrollments found:', enrollmentIds);

    // Find payments for these enrollments
    const  payments = await Payment.find({ enrollment: { $in: enrollmentIds } })
      .populate({
        path: 'enrollment',
        populate: { path: 'student', select: 'firstName lastName name email' } // Add firstName, lastName, name
      })
      .sort({ createdAt: -1 });
    console.log('Payments found:', payments);

    res.json(payments);
  } catch (err) {
    console.error('Error fetching tutor payments:', err);
    res.status(500).json({ message: 'Failed to fetch tutor payments' });
  }
});

// New endpoint to update enrollment payment status
router.post('/update-enrollment-payment', authenticateToken, async (req, res) => {
  try {
    const { enrollmentId, status, amount } = req.body;
    if (!enrollmentId || !status) {
      return res.status(400).json({ message: 'Missing enrollmentId or status' });
    }

    const updateData = {
      paymentStatus: status,
    };
    if (status === 'paid' || status === 'succeeded') {
      updateData.amountPaid = amount || 0;
      updateData.paymentDate = new Date();
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(enrollmentId, updateData, { new: true });
    if (!updatedEnrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Enrollment payment status updated', enrollment: updatedEnrollment });
  } catch (err) {
    console.error('Error updating enrollment payment status:', err);
    res.status(500).json({ message: 'Failed to update enrollment payment status' });
  }
});

module.exports = router;
