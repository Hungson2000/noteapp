const mongoose = require('mongoose');
 
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String, trim: true }],
  color: { type: String, default: '#ffffff' },
  isPinned: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false },
  shareId: { type: String, unique: true, sparse: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  reminderAt: { type: Date, default: null },
  reminderSent: { type: Boolean, default: false },
  history: [{
    title: String,
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
 
module.exports = mongoose.model('Note', noteSchema);
 