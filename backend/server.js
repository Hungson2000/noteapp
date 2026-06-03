
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ 
  windowMs: 15*60*1000, 
  max: 20,
  message: { message: "Quá nhiều lần thử. Vui lòng thử lại sau 15 phút!" },
  skipSuccessfulRequests: true
});
const apiLimiter = rateLimit({ windowMs: 1*60*1000, max: 200 });

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// CORS - chỉ cho phép domain Netlify và localhost
app.use(cors({
origin: [
  'https://noteapp-hungson.netlify.app',
  'https://noteapp-hungson.vercel.app',
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
  max: 50,
  message: { message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút!' }
});

app.use(generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const pushRoutes = require('./routes/push');
const aiRoutes = require('./routes/ai');
require('./reminder'); 
// Health check - keep alive
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
if (process.env.NODE_ENV !== 'test') app.use('/api/auth/login', loginLimiter);
if (process.env.NODE_ENV !== 'test') app.use('/api/auth/register', loginLimiter);
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NoteApp API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));






module.exports = app;
