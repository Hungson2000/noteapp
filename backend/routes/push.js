const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const auth = require('../middleware/auth');
const User = require('../models/User');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: 'Thieu subscription' });
    await User.findByIdAndUpdate(req.userId, { pushSubscription: JSON.stringify(subscription) });
    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.post('/send-test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.pushSubscription) return res.status(400).json({ message: 'Chua dang ky push' });
    const subscription = JSON.parse(user.pushSubscription);
    const payload = JSON.stringify({
      title: 'NoteApp Nhac nho',
      body: 'Ban co note chua on hon 7 ngay roi!',
      icon: '/icon-192.png'
    });
    await webpush.sendNotification(subscription, payload);
    res.json({ success: true });
  } catch (err) {
    console.error('Push send error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
