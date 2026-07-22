const express = require('express');
const router = express.Router();
const Notifications = require('../models/Notifications');
const authenticateToken = require('../Middleware/authMiddleware');
const authenticateTutor = require('../Middleware/auth');

// Tutor: send a notification to one student
router.post('/send', authenticateTutor, async (req, res) => {
  try {
    const { recipient, user, course, message, type } = req.body;
    const recipientId = recipient || user;

    if (!recipientId || !message || !message.trim()) {
      return res.status(400).json({ message: 'recipient and message are required' });
    }

    const notification = await Notifications.create({
      recipient: recipientId,
      sender: req.tutor._id,
      course,
      message: message.trim(),
      type: type || 'tutor-message'
    });

    res.status(201).json(notification);
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tutor: fetch notifications sent by the logged-in tutor
router.get('/sent', authenticateTutor, async (req, res) => {
  try {
    const notifications = await Notifications.find({ sender: req.tutor._id })
      .populate('course', 'title')
      .populate('recipient', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const grouped = notifications.reduce((acc, n) => {
      const courseId = n.course?._id?.toString() || 'no-course';
      const messageKey = `${courseId}::${n.message}`;
      const key = `${messageKey}::${new Date(n.createdAt).toISOString()}`;

      if (!acc[key]) {
        acc[key] = {
          _id: n._id,
          course: n.course || null,
          message: n.message,
          createdAt: n.createdAt,
          recipients: 0
        };
      }
      acc[key].recipients += 1;
      return acc;
    }, {});

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error fetching sent notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all notifications for the logged-in student
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notifications.find({ recipient: req.user.userId })
      .populate('sender', 'firstName lastName email')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await Notifications.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notifications.updateMany({ recipient: req.user.userId }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;