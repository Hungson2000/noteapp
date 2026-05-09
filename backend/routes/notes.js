const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// GET /api/notes - Lấy ghi chú có phân trang
router.get('/', auth, async (req, res) => {
  try {
    const { tag, page = 1, limit = 6 } = req.query;
    let query = { user: req.userId, isDeleted: false };
    if (tag) query.tags = tag;

    const total = await Note.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const notes = await Note.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ notes, total, totalPages, currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/notes/trash - Lấy ghi chú trong thùng rác
router.get('/trash', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
      isDeleted: true
    }).sort({ deletedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/notes/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await Note.countDocuments({ user: req.userId, isDeleted: false });
    const pinned = await Note.countDocuments({ user: req.userId, isPinned: true, isDeleted: false });
    const shared = await Note.countDocuments({ user: req.userId, isShared: true, isDeleted: false });
    const tags = await Note.distinct('tags', { user: req.userId, isDeleted: false });
    const trash = await Note.countDocuments({ user: req.userId, isDeleted: true });
    res.json({ total, pinned, shared, totalTags: tags.length, trash });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET /api/notes/share/:shareId
router.get('/share/:shareId', async (req, res) => {
  try {
    const note = await Note.findOne({ shareId: req.params.shareId, isShared: true, isDeleted: false });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/notes
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, color } = req.body;
    const note = new Note({
      title, content,
      tags: tags || [],
      color: color || '#ffffff',
      user: req.userId
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/notes/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, color, isPinned } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, content, tags, color, isPinned },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/notes/:id/share
router.put('/:id/share', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    if (!note.isShared) {
      note.shareId = crypto.randomBytes(8).toString('hex');
      note.isShared = true;
    } else {
      note.isShared = false;
      note.shareId = null;
    }
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/notes/:id - Chuyển vào thùng rác
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã chuyển vào thùng rác' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/notes/:id/restore - Khôi phục từ thùng rác
router.put('/:id/restore', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã khôi phục ghi chú' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/notes/:id/permanent - Xóa vĩnh viễn
router.delete('/:id/permanent', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa vĩnh viễn' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE /api/notes/trash/empty - Dọn sạch thùng rác
router.delete('/trash/empty', auth, async (req, res) => {
  try {
    await Note.deleteMany({ user: req.userId, isDeleted: true });
    res.json({ message: 'Đã dọn sạch thùng rác' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});
// GET /api/notes/reminders - Lấy danh sách reminder
router.get('/reminders', auth, async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.userId,
      reminderAt: { $ne: null },
      isDeleted: false
    }).sort({ reminderAt: 1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/notes/:id/reminder - Đặt hoặc xóa reminder
router.put('/:id/reminder', auth, async (req, res) => {
  try {
    const { reminderAt } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { 
        reminderAt: reminderAt || null,
        reminderSent: false
      },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});
module.exports = router;