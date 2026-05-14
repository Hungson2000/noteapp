const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/summarize', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) return res.status(400).json({ message: 'Thieu noi dung' });
    
    const prompt = `Tóm tắt ghi chú sau trong 2-3 câu ngắn gọn bằng tiếng Việt:\nTiêu đề: ${title}\nNội dung: ${content}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không thể tóm tắt';
    res.json({ summary });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
