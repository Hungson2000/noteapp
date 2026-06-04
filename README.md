# 📝 NoteApp

A full-stack note-taking web application with smart review reminders, AI assistant, and productivity tools — built for students and learners.

🌐 **Live Demo:** [noteapp-hungson.vercel.app](https://noteapp-hungson.vercel.app)

---

## ✨ Features

### 📒 Notes
- Create, edit, delete notes with title, content, tags, and folders
- Soft delete with trash bin & permanent delete
- Pin important notes
- Share notes via public link
- Export notes as TXT or PDF

### 🧠 Smart Review System
- Tracks last review date and review count per note
- Color-coded overdue indicators (not reviewed in X days)
- Email & push notification reminders via cron job

### 🤖 AI Assistant
- Powered by Google Gemini API
- Summarize, expand, or improve note content

### 📅 Productivity Tools
- **Calendar** — view notes by date
- **Kanban Board** — drag-and-drop task management
- **Pomodoro Timer** — focus sessions built-in
- **Daily Goal** — set and track daily note targets
- **Streak Tracker** — maintain your learning streak
- **Charts** — visualize your note activity

### 🎨 Customization
- Dark Mode
- Multiple color themes
- Custom avatar upload (Cloudinary)

### 🔐 Authentication
- Register / Login with JWT
- Change password & profile info
- Forgot password via email (reset link)
- Web Push Notifications (VAPID)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript (PWA) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, bcryptjs |
| File Upload | Cloudinary, Multer |
| Email | Nodemailer (Gmail) |
| Push Notifications | Web Push (VAPID) |
| AI | Google Gemini API |
| Scheduler | node-cron |
| Validation | express-validator |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Gmail account (for email features)

### 1. Clone the repository
\\ash
git clone https://github.com/Hungson2000/noteapp.git
cd noteapp
\
### 2. Setup Backend
\\ash
cd backend
npm install
\
Create a \.env\ file in the \ackend\ folder:
\\env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your@email.com

GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
\
Start the backend:
\\ash
npm run dev
\
### 3. Setup Frontend
Open \rontend/index.html\ in your browser, or use Live Server in VS Code.

> Make sure the API URL in the frontend JS points to \http://localhost:5000
---

## 📁 Project Structure

\noteapp/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT middleware
│   │   └── validate.js      # Input validation rules
│   ├── models/
│   │   ├── User.js
│   │   └── Note.js
│   ├── routes/
│   │   ├── auth.js          # Auth & user routes
│   │   ├── notes.js         # Note CRUD routes
│   │   ├── ai.js            # Gemini AI route
│   │   └── push.js          # Push notification route
│   ├── cloudinary.js        # Cloudinary config
│   ├── reminder.js          # Cron job for reminders
│   └── server.js            # Express app entry point
└── frontend/
    ├── index.html           # Login page
    ├── app.html             # Main app
    ├── js/
    │   ├── app.js           # Main frontend logic
    │   └── auth.js          # Auth logic
    └── css/
        └── style.css
\
---

## 🔒 Security

- JWT authentication on all protected routes
- Rate limiting: 5 login attempts per 15 minutes
- Input validation on all POST/PUT routes
- Passwords hashed with bcryptjs (salt rounds: 10)
- Environment variables for all secrets (never committed to Git)

---

## 👨‍💻 Author

**Hung Son** — [@Hungson2000](https://github.com/Hungson2000)

> Built as a personal full-stack learning project. Feedback and contributions are welcome!
