const { upload } = require('../cloudinary');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
 
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
 
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoặc password không đúng' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc password không đúng' });
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
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
 
// PUT /api/auth/update - Cập nhật email/username
router.put('/update', auth, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, email },
      { new: true }
    ).select('-password');
    res.json({ message: 'Cập nhật thành công!', user });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
 
// PUT /api/auth/change-password - Đổi password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
 
// PUT /api/auth/avatar - Cập nhật avatar via Cloudinary
router.put('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const avatarUrl = req.file ? req.file.path : req.body.avatar;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    res.json({ message: 'Cập nhật avatar thành công!', user });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});
 
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại!' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000;
    await user.save();
 
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
 
    const resetLink = `https://noteapp-hungson.vercel.app/reset-password.html?token=${resetToken}`;
 
    await transporter.sendMail({
      from: `"NoteApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Đặt lại mật khẩu NoteApp',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">📝 NoteApp</h2>
          <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
          <p>Click vào nút bên dưới để đặt lại mật khẩu:</p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:12px 24px; background:#4f46e5; color:white; border-radius:8px; text-decoration:none; margin:16px 0;">
            🔑 Đặt lại mật khẩu
          </a>
          <p style="color:#666; font-size:13px;">Link này sẽ hết hạn sau <strong>1 giờ</strong>.</p>
          <p style="color:#666; font-size:13px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
        </div>
      `
    });
 
    res.json({ message: 'Email đặt lại mật khẩu đã được gửi!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
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
      return res.status(400).json({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.json({ message: 'Đặt lại mật khẩu thành công! Hãy đăng nhập lại.' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});
 
// POST /api/auth/push-subscription - Lưu push subscription
router.post('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      pushSubscription: JSON.stringify(subscription)
    });
    res.json({ message: 'Đã lưu push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});
 
// DELETE /api/auth/push-subscription - Xóa push subscription
router.delete('/push-subscription', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { pushSubscription: null });
    res.json({ message: 'Đã xóa push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});
 
// GET /api/auth/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});
 
module.exports = router;
// GET /api/auth/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    res.json(user.notifications.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) { res.status(500).json({ message: 'Loi server' }); }
});

// PUT /api/auth/notifications/read-all
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $set: { 'notifications.$[].read': true } });
    res.json({ message: 'Da doc tat ca!' });
  } catch (err) { res.status(500).json({ message: 'Loi server' }); }
});

// DELETE /api/auth/notifications/:id
router.delete('/notifications/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $pull: { notifications: { _id: req.params.id } } });
    res.json({ message: 'Da xoa!' });
  } catch (err) { res.status(500).json({ message: 'Loi server' }); }
});

// POST /api/auth/notifications
router.post('/notifications', auth, async (req, res) => {
  try {
    const { message, type } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $push: { notifications: { message, type: type || 'info', read: false, createdAt: new Date() } }
    });
    res.json({ message: 'Da them thong bao!' });
  } catch (err) { res.status(500).json({ message: 'Loi server' }); }
});
