const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { message: 'Qua nhieu lan thu. Vui long thu lai sau 15 phut!' } });
const apiLimiter = rateLimit({ windowMs: 1*60*1000, max: 100 });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// CORS - chá»‰ cho phĂ©p domain Netlify vĂ  localhost
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
  windowMs: 15 * 60 * 1000, // 15 phĂºt
  max: 100,
  message: { message: 'QuĂ¡ nhiá»u request, vui lĂ²ng thá»­ láº¡i sau!' }
});

// Rate limiting cho auth - nghiĂªm ngáº·t hÆ¡n
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phĂºt
  max: 10,
  message: { message: 'QuĂ¡ nhiá»u láº§n Ä‘Äƒng nháº­p, vui lĂ²ng thá»­ láº¡i sau 15 phĂºt!' }
});

app.use(generalLimiter);

// Routes
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
require('./reminder'); 
// Health check - keep alive
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'NoteApp API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('âœ… MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`đŸ€ Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('âŒ MongoDB connection error:', err));


