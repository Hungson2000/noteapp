# 📝 NoteApp

> Ứng dụng ghi chú thông minh full-stack với AI, nhắc nhở, chia sẻ và nhiều tính năng hiện đại.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-noteapp--hungson.vercel.app-6366f1?style=for-the-badge)](https://noteapp-hungson.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Hungson2000-181717?style=for-the-badge&logo=github)](https://github.com/Hungson2000/noteapp)

## ✨ Tính năng nổi bật

- 📋 Tạo, sửa, xóa ghi chú với rich text editor
- 📁 Phân loại theo Folder và Tags
- 📌 Ghim ghi chú quan trọng
- 🔍 Tìm kiếm thông minh với Fuse.js
- 🔐 Xác thực JWT, khóa ghi chú bằng mật khẩu
- 🤖 AI Tóm tắt bằng Gemini API
- 📲 Chia sẻ ghi chú + QR Code
- 🔔 Push Notification + nhắc nhở qua email
- 📊 Dashboard, biểu đồ Chart.js
- 🍅 Pomodoro Timer, Kanban Board
- 🎙️ Voice Note, Markdown Preview
- 🌙 Dark Mode, 5 Themes
- 📱 PWA - cài được trên điện thoại
- ⌨️ Keyboard Shortcuts

## 🛠️ Tech Stack

| Phần | Công nghệ |
|------|-----------|
| Frontend | Vanilla JS, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Auth | JWT, Bcrypt |
| Storage | Cloudinary |
| Email | Nodemailer |
| AI | Google Gemini API |
| Deploy | Vercel + Render |

## 🚀 Chạy Local

```bash
cd backend
npm install
npm run dev
```

Tạo file `.env` trong `backend/`:
```env
MONGO_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=...
PORT=5000
```

## 🌐 Demo

- Frontend: https://noteapp-hungson.vercel.app
- Backend: https://noteapp-backend-goqh.onrender.com

## 👤 Tác giả

**Lê Hùng Sơn** - Sinh viên Kỹ thuật Phần mềm - Đại học Duy Tân

GitHub: [@Hungson2000](https://github.com/Hungson2000)
