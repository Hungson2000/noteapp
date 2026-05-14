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

// Lưu subscription
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.user.id, { pushSubscription: JSON.stringify(subscription) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Gửi push test
router.post('/send-test', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.pushSubscription) return res.status(400).json({ message: 'Chưa đăng ký push' });
    const subscription = JSON.parse(user.pushSubscription);
    const payload = JSON.stringify({
      title: '📚 NoteApp Nhắc nhở',
      body: 'Bạn có note chưa ôn hơn 7 ngày rồi!',
      icon: '/icon-192.png'
    });
    await webpush.sendNotification(subscription, payload);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gửi push' });
  }
});

module.exports = router;
