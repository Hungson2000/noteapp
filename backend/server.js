const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// CORS - chỉ cho phép domain Netlify và localhost
app.use(cors({
origin: [
  'https://noteapp-hungson.netlify.app',
  'https://noteapp-seven-kohl.vercel.app',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));

// Rate limiting chung
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  message: { message: 'Quá nhiều request, vui lòng thử lại sau!' }
});

// Rate limiting cho auth - nghiêm ngặt hơn
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  message: { message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút!' }
});

app.use(generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
require('./reminder'); 

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NoteApp API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));