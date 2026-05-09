const cron = require('node-cron');
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const Note = require('./models/Note');
const User = require('./models/User');

webpush.setVapidDetails(
  'mailto:' + process.env.EMAIL_USER,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const oneMinuteLater = new Date(now.getTime() + 60 * 1000);
    const notes = await Note.find({
      reminderAt: { $gte: now, $lte: oneMinuteLater },
      reminderSent: false,
      isDeleted: false
    }).populate('user');

    for (const note of notes) {
      const user = note.user;
      if (!user) continue;
      try {
        await transporter.sendMail({
          from: `"NoteApp 📝" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `⏰ Nhắc nhở: ${note.title}`,
          html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;">
            <div style="background:#4f46e5;padding:20px;border-radius:10px 10px 0 0;">
              <h2 style="color:white;margin:0;">📝 NoteApp - Nhắc nhở</h2>
            </div>
            <div style="background:#f9f9f9;padding:20px;border-radius:0 0 10px 10px;">
              <h3 style="color:#4f46e5;">⏰ ${note.title}</h3>
              <p style="color:#555;">${note.content.replace(/<[^>]*>/g,'').substring(0,200)}</p>
              <p style="color:#888;font-size:13px;">Thời gian: ${new Date(note.reminderAt).toLocaleString('vi-VN')}</p>
              <a href="https://noteapp-hungson.netlify.app" style="background:#4f46e5;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Mở NoteApp</a>
            </div>
          </div>`
        });
      } catch(e) { console.error('Email error:', e.message); }

      if (user.pushSubscription) {
        try {
          await webpush.sendNotification(
            JSON.parse(user.pushSubscription),
            JSON.stringify({
              title: `⏰ ${note.title}`,
              body: note.content.replace(/<[^>]*>/g,'').substring(0,100),
              icon: '/icons/icon-192.png',
              url: '/app.html'
            })
          );
        } catch(e) {
          if (e.statusCode === 410) {
            await User.findByIdAndUpdate(user._id, { pushSubscription: null });
          }
        }
      }
      await Note.findByIdAndUpdate(note._id, { reminderSent: true });
      console.log(`✅ Reminder sent: ${note.title}`);
    }
  } catch(err) { console.error('Cron error:', err.message); }
});

console.log('⏰ Reminder cron job started');