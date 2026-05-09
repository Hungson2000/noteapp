const API = 'https://noteapp-backend-goqh.onrender.com/api';

// Toast notification
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const buttons = document.querySelectorAll('.tab-btn');
  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    buttons[0].classList.add('active');
    buttons[1].classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    buttons[0].classList.remove('active');
    buttons[1].classList.add('active');
  }
}

async function login() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showToast('Vui lòng điền đầy đủ thông tin!', 'warning');
    return;
  }

  // Hiện loading
  const btn = document.querySelector('#login-form .btn-primary');
  btn.textContent = '⏳ Đang đăng nhập...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Đăng nhập thành công!', 'success');
      setTimeout(() => window.location.href = 'app.html', 1000);
    } else {
      showToast(data.message, 'error');
      btn.textContent = 'Đăng nhập';
      btn.disabled = false;
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
    btn.textContent = 'Đăng nhập';
    btn.disabled = false;
  }
}

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !email || !password) {
    showToast('Vui lòng điền đầy đủ thông tin!', 'warning');
    return;
  }
  if (password.length < 6) {
    showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'warning');
    return;
  }
  if (!email.includes('@')) {
    showToast('Email không hợp lệ!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Đăng ký thành công! Hãy đăng nhập.', 'success');
      setTimeout(() => showTab('login'), 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

if (localStorage.getItem('token')) {
  window.location.href = 'app.html';
}
function showForgotForm() {
  const forgotForm = document.getElementById('forgot-form');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabSwitch = document.querySelector('.tab-switch');

  if (forgotForm.style.display === 'none') {
    forgotForm.style.display = 'block';
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    tabSwitch.style.display = 'none';
  } else {
    forgotForm.style.display = 'none';
    loginForm.style.display = 'block';
    tabSwitch.style.display = 'flex';
  }
}

async function forgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) {
    showToast('Vui lòng nhập email!', 'warning');
    return;
  }

  const btn = document.querySelector('#forgot-form .btn-primary');
  btn.textContent = '⏳ Đang gửi...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Email đã được gửi! Kiểm tra hộp thư của bạn.', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  } finally {
    btn.textContent = '📧 Gửi email đặt lại';
    btn.disabled = false;
  }
}