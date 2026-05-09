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

    // Kiá»ƒm tra user Ä‘Ă£ tá»“n táº¡i chÆ°a
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng' });
    }

    // MĂ£ hĂ³a password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Táº¡o user má»›i
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'ÄÄƒng kĂ½ thĂ nh cĂ´ng!' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TĂ¬m user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email hoáº·c password khĂ´ng Ä‘Ăºng' });
    }

    // Kiá»ƒm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoáº·c password khĂ´ng Ä‘Ăºng' });
    }

    // Táº¡o JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
  }
});
// PUT /api/auth/update - Cáº­p nháº­t email/username
router.put('/update', auth, async (req, res) => {
  try {
    const { username, email } = req.body;

    // Kiá»ƒm tra email Ä‘Ă£ tá»“n táº¡i chÆ°a
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existing) {
        return res.status(400).json({ message: 'Email Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { username, email },
      { new: true }
    ).select('-password');

    res.json({ message: 'Cáº­p nháº­t thĂ nh cĂ´ng!', user });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
  }
});
// PUT /api/auth/change-password - Äá»•i password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Máº­t kháº©u hiá»‡n táº¡i khĂ´ng Ä‘Ăºng' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Äá»•i máº­t kháº©u thĂ nh cĂ´ng!' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
  }
});
// PUT /api/auth/avatar - Cáº­p nháº­t avatar
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar },
      { new: true }
    ).select('-password');
    res.json({ message: 'Cáº­p nháº­t avatar thĂ nh cĂ´ng!', user });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server' });
  }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email khĂ´ng tá»“n táº¡i!' });
    }

    // Táº¡o reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 giá»
    await user.save();

    // Gá»­i email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `https://noteapp-hungson.netlify.app/reset-password.html?token=${resetToken}`;

    await transporter.sendMail({
      from: `"NoteApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'đŸ”’ Äáº·t láº¡i máº­t kháº©u NoteApp',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">đŸ“ NoteApp</h2>
          <p>Báº¡n Ä‘Ă£ yĂªu cáº§u Ä‘áº·t láº¡i máº­t kháº©u.</p>
          <p>Click vĂ o nĂºt bĂªn dÆ°á»›i Ä‘á»ƒ Ä‘áº·t láº¡i máº­t kháº©u:</p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:12px 24px; background:#4f46e5; color:white; border-radius:8px; text-decoration:none; margin:16px 0;">
            đŸ”‘ Äáº·t láº¡i máº­t kháº©u
          </a>
          <p style="color:#666; font-size:13px;">Link nĂ y sáº½ háº¿t háº¡n sau <strong>1 giá»</strong>.</p>
          <p style="color:#666; font-size:13px;">Náº¿u báº¡n khĂ´ng yĂªu cáº§u Ä‘áº·t láº¡i máº­t kháº©u, hĂ£y bá» qua email nĂ y.</p>
        </div>
      `
    });

    res.json({ message: 'Email Ä‘áº·t láº¡i máº­t kháº©u Ä‘Ă£ Ä‘Æ°á»£c gá»­i!' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
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
      return res.status(400).json({ message: 'Link Ä‘áº·t láº¡i máº­t kháº©u khĂ´ng há»£p lá»‡ hoáº·c Ä‘Ă£ háº¿t háº¡n!' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Äáº·t láº¡i máº­t kháº©u thĂ nh cĂ´ng! HĂ£y Ä‘Äƒng nháº­p láº¡i.' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server', error: err.message });
  }
});
// POST /api/auth/push-subscription - LÆ°u push subscription
router.post('/push-subscription', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      pushSubscription: JSON.stringify(subscription)
    });
    res.json({ message: 'ÄĂ£ lÆ°u push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server' });
  }
});

// DELETE /api/auth/push-subscription - XĂ³a push subscription
router.delete('/push-subscription', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { pushSubscription: null });
    res.json({ message: 'ÄĂ£ xĂ³a push subscription!' });
  } catch (err) {
    res.status(500).json({ message: 'Lá»—i server' });
  }
});

// GET /api/auth/vapid-public-key - Láº¥y public key cho frontend
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});
module.exports = router;


