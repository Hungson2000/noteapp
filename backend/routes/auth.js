const { upload } = require('../cloudinary');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // FIX: chuy?n lên top-level, không require bên trong handler
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validate, rules } = require('../middleware/validate');
 
// POST /api/auth/register
router.post('/register', rules.register, validate, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ð? ðý?c s? d?ng' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Ðãng k? thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// POST /api/auth/login
router.post('/login', rules.login, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ho?c password không ðúng' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ho?c password không ðúng' });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// PUT /api/auth/update - C?p nh?t email/username
router.put('/update', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(400).json({ message: 'Email ð? ðý?c s? d?ng' });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, email },
      { returnDocument: 'after' }
    ).select('-password');
    res.json({ message: 'C?p nh?t thành công!', user });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// PUT /api/auth/change-password
router.put('/change-password', auth, rules.changePassword, validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'M?t kh?u hi?n t?i không ðúng' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Ð?i m?t kh?u thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// PUT /api/auth/avatar - C?p nh?t avatar via Cloudinary
router.put('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = req.file ? req.file.path : req.body.avatar;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { returnDocument: 'after' }
    ).select('-password');
    res.json({ message: 'C?p nh?t avatar thành công!', user });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// POST /api/auth/forgot-password
router.post('/forgot-password', rules.forgotPassword, validate, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không t?n t?i!' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
 
    // FIX: dùng transporter ð? kh?i t?o top-level thay v? t?o m?i m?i l?n
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
 
    const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
 
    await transporter.sendMail({
      from: `"NoteApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '?? Ð?t l?i m?t kh?u NoteApp',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">?? NoteApp</h2>
          <p>B?n ð? yêu c?u ð?t l?i m?t kh?u.</p>
          <p>Click vào nút bên dý?i ð? ð?t l?i m?t kh?u:</p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:12px 24px; background:#4f46e5; color:white; border-radius:8px; text-decoration:none; margin:16px 0;">
            ?? Ð?t l?i m?t kh?u
          </a>
          <p style="color:#666; font-size:13px;">Link này s? h?t h?n sau <strong>1 gi?</strong>.</p>
          <p style="color:#666; font-size:13px;">N?u b?n không yêu c?u ð?t l?i m?t kh?u, h?y b? qua email này.</p>
        </div>
      `
    });
 
    res.json({ message: 'Email ð?t l?i m?t kh?u ð? ðý?c g?i!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ message: 'Link ð?t l?i m?t kh?u không h?p l? ho?c ð? h?t h?n!' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ message: 'Ð?t l?i m?t kh?u thành công! H?y ðãng nh?p l?i.' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server', error: err.message });
  }
});
 
// POST /api/auth/push-subscription - Lýu push subscription
router.post('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      pushSubscription: JSON.stringify(subscription)
    });
    res.json({ message: 'Ð? lýu push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// DELETE /api/auth/push-subscription - Xóa push subscription
router.delete('/push-subscription', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { pushSubscription: null });
    res.json({ message: 'Ð? xóa push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// GET /api/auth/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});
 
// ============================================================
// FIX BUG 1: Các routes sau ðây trý?c ðây b? ð?t SAU module.exports
// nên không bao gi? ðý?c ðãng k?. Ð? chuy?n lên trý?c module.exports.
// ============================================================
 
// GET /api/auth/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    res.json(user.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// PUT /api/auth/notifications/read-all
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $set: { 'notifications.$[].read': true } });
    res.json({ message: 'Ð? ð?c t?t c?!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// DELETE /api/auth/notifications/:id
router.delete('/notifications/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $pull: { notifications: { _id: req.params.id } } });
    res.json({ message: 'Ð? xóa!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// POST /api/auth/notifications
router.post('/notifications', auth, async (req, res) => {
  try {
    const { message, type } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $push: { notifications: { message, type: type || 'info', read: false, createdAt: new Date() } }
    });
    res.json({ message: 'Ð? thêm thông báo!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// GET /api/auth/streak
router.get('/streak', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('dailyGoal streak lastActiveDate');
    const Note = require('../models/Note');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Note.countDocuments({
      user: req.userId,
      isDeleted: false,
      createdAt: { $gte: today }
    });
    res.json({ dailyGoal: user.dailyGoal || 3, streak: user.streak || 0, todayCount });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// PUT /api/auth/goal
router.put('/goal', auth, async (req, res) => {
  try {
    const { dailyGoal } = req.body;
    await User.findByIdAndUpdate(req.userId, { dailyGoal });
    res.json({ message: 'Ð? c?p nh?t m?c tiêu!' });
  } catch (err) {
    res.status(500).json({ message: 'L?i server' });
  }
});
 
// FIX: module.exports luôn ph?i ? CU?I FILE
module.exports = router
