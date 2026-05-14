const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/summarize', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) return res.status(400).json({ message: 'Thieu noi dung' });
    
    const prompt = `Tom tat ghi chu sau trong 2-3 cau ngan gon bang tieng Viet:\nTieu de: ${title}\nNoi dung: ${content}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    
    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data).substring(0, 500));
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || 'Khong the tom tat';
    res.json({ summary });
  } catch (err) {
    console.error('AI error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
