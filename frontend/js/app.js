const API = 'https://noteapp-backend-goqh.onrender.com/api';
const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
let selectedColor = '#ffffff';
let activeTag = null;
let currentPage = 1;
const NOTES_PER_PAGE = 6;
if (!token) window.location.href = 'index.html';

// Dark mode
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

document.getElementById('username-display').textContent = user?.username || 'User';

if (user?.avatar) {
  document.getElementById('avatar-display').innerHTML = `<img src="${user.avatar}" class="avatar-img">`;
}

loadNotes();
loadStats();

// ==================== TOAST ====================
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
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

// ==================== NOTES ====================
async function loadNotes(tag = null, page = 1) {
  try {
    currentPage = page;
    const url = `${API}/notes?page=${page}&limit=${NOTES_PER_PAGE}${tag ? `&tag=${tag}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = 'index.html';
      return;
    }
    const data = await res.json();
    renderNotes(data.notes);
    renderTagsFilter(data.notes);
    renderPagination(data.totalPages, data.currentPage, tag);
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}
function renderNotes(notes) {
  const grid = document.getElementById('notes-grid');
  if (notes.length === 0) {
    grid.innerHTML = '<p class="empty-state">📭 Chưa có ghi chú nào!</p>';
    return;
  }
  grid.innerHTML = notes.map(note => `
    <div class="note-card ${note.isPinned ? 'pinned' : ''}"
         id="note-${note._id}"
         style="background:${note.color || '#ffffff'}">
      <div class="note-card-header">
        <h4>${note.title}</h4>
        <span class="pin-icon ${note.isPinned ? 'active' : ''}"
              onclick="togglePin('${note._id}', ${note.isPinned})"
              title="${note.isPinned ? 'Bỏ ghim' : 'Ghim'}">📌</span>
      </div>
      <p>${note.content}</p>
      ${note.tags?.length ? `
        <div class="note-tags">
          ${note.tags.map(t => `<span class="note-tag">#${t}</span>`).join('')}
        </div>` : ''}
      <p class="note-date">${new Date(note.createdAt).toLocaleDateString('vi-VN')}</p>
      ${note.reminderAt ? `<div style="font-size:11px; color:#f59e0b; margin-bottom:6px;">⏰ ${new Date(note.reminderAt).toLocaleString('vi-VN')}${note.reminderSent ? ' ✅' : ''}</div>` : ''}
      <div class="note-card-actions">
        <button class="btn-edit" onclick="editNote('${note._id}', \`${note.title}\`, \`${note.content}\`, '${note.color}', '${note.tags?.join(',')}')">✏️ Sửa</button>
        <button class="btn-delete" onclick="deleteNote('${note._id}')">🗑️ Xóa</button>
        <button class="btn-share ${note.isShared ? 'shared' : ''}" onclick="toggleShare('${note._id}', ${note.isShared}, '${note.shareId}')">
          ${note.isShared ? '🔗 Đã chia sẻ' : '📤 Chia sẻ'}
        </button>
        <button id="remind-btn-${note._id}" onclick="showReminderPicker('${note._id}')" title="Đặt nhắc nhở" style="background:none; border:1px solid var(--border); border-radius:6px; padding:4px 8px; cursor:pointer; font-size:13px;">⏰</button>
      </div>
    </div>
  `).join('');
}

function renderTagsFilter(notes) {
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];
  const container = document.getElementById('tags-filter');
  if (allTags.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <button class="tag-filter-btn ${activeTag === null ? 'active' : ''}" onclick="filterByTag(null)">Tất cả</button>
    ${allTags.map(t => `
      <button class="tag-filter-btn ${activeTag === t ? 'active' : ''}" onclick="filterByTag('${t}')">#${t}</button>
    `).join('')}
  `;
}
function renderPagination(totalPages, currentPage, tag) {
  const container = document.getElementById('pagination');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Nút Previous
  html += `<button class="page-btn" onclick="loadNotes('${tag}', ${currentPage - 1})" 
           ${currentPage === 1 ? 'disabled' : ''}>← Trước</button>`;

  // Các trang
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
               onclick="loadNotes('${tag}', ${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-info">...</span>`;
    }
  }

  // Nút Next
  html += `<button class="page-btn" onclick="loadNotes('${tag}', ${currentPage + 1})"
           ${currentPage === totalPages ? 'disabled' : ''}>Sau →</button>`;

  html += `<span class="page-info">Trang ${currentPage}/${totalPages}</span>`;

  container.innerHTML = html;
}
function filterByTag(tag) {
  activeTag = tag;
  loadNotes(tag, 1);
}

async function loadStats() {
  try {
    const res = await fetch(`${API}/notes/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const stats = await res.json();
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pinned').textContent = stats.pinned;
    document.getElementById('stat-shared').textContent = stats.shared;
    document.getElementById('stat-tags').textContent = stats.totalTags;
  } catch (err) {
    console.error('Lỗi load stats:', err);
  }
}

function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}
// ==================== RICH TEXT EDITOR ====================
function formatText(command) {
  document.execCommand(command, false, null);
  document.getElementById('note-content').focus();
}

function formatBlock(tag) {
  document.execCommand('formatBlock', false, tag);
  document.getElementById('note-content').focus();
}

function clearFormat() {
  document.execCommand('removeFormat', false, null);
  document.getElementById('note-content').focus();
}

function getEditorContent() {
  return document.getElementById('note-content').innerHTML;
}

function setEditorContent(html) {
  document.getElementById('note-content').innerHTML = html;
}

function clearEditor() {
  document.getElementById('note-content').innerHTML = '';
}

async function createNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = getEditorContent().trim();
  const tagsInput = document.getElementById('note-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!title || !content || content === '<br>') {
    showToast('Vui lòng điền tiêu đề và nội dung!', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, tags, color: selectedColor })
    });
    if (res.ok) {
      document.getElementById('note-title').value = '';
      document.getElementById('note-tags').value = '';
      clearEditor();
      showToast('Tạo ghi chú thành công!', 'success');
      loadNotes(activeTag);
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

function editNote(id, title, content, color, tags) {
  document.getElementById('note-title').value = title;
  setEditorContent(content);
  document.getElementById('note-tags').value = tags || '';
  selectedColor = color || '#ffffff';
  document.querySelectorAll('.color-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.color === selectedColor);
  });
  const btn = document.querySelector('.btn-primary');
  btn.textContent = '💾 Cập nhật';
  btn.onclick = () => updateNote(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function updateNote(id) {
  const title = document.getElementById('note-title').value.trim();
  const content = getEditorContent().trim();
  const tagsInput = document.getElementById('note-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

  try {
    const res = await fetch(`${API}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, tags, color: selectedColor })
    });
    if (res.ok) {
      document.getElementById('note-title').value = '';
      document.getElementById('note-tags').value = '';
      clearEditor();
      const btn = document.querySelector('.btn-primary');
      btn.textContent = '➕ Thêm ghi chú';
      btn.onclick = createNote;
      showToast('Cập nhật ghi chú thành công!', 'success');
      loadNotes(activeTag);
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

async function deleteNote(id) {
  if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
  try {
    const res = await fetch(`${API}/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Xóa ghi chú thành công!', 'success');
      loadNotes(activeTag);
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

async function togglePin(id, isPinned) {
  try {
    await fetch(`${API}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isPinned: !isPinned })
    });
    showToast(isPinned ? 'Đã bỏ ghim!' : 'Đã ghim ghi chú!', 'info');
    loadNotes(activeTag);
    loadStats();
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

async function toggleShare(id, isShared, shareId) {
  try {
    const res = await fetch(`${API}/notes/${id}/share`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const note = await res.json();
    if (note.isShared) {
      showShareModal(note.shareId);
    } else {
      showToast('Đã tắt chia sẻ ghi chú!', 'info');
    }
    loadNotes(activeTag);
    loadStats();
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

function showShareModal(shareId) {
  const link = `https://noteapp-hungson.netlify.app/share.html?id=${shareId}`;
  document.getElementById('share-link-input').value = link;
  document.getElementById('share-modal').style.display = 'flex';
}

function closeShareModal() {
  document.getElementById('share-modal').style.display = 'none';
}

function copyShareLink() {
  const input = document.getElementById('share-link-input');
  navigator.clipboard.writeText(input.value);
  showToast('Đã copy link chia sẻ!', 'success');
}

// ==================== SEARCH ====================
function searchNotes() {
  const keyword = document.getElementById('search-input').value.toLowerCase();
  const cards = document.querySelectorAll('.note-card');
  cards.forEach(card => {
    const title = card.querySelector('h4').textContent.toLowerCase();
    const content = card.querySelector('p').textContent.toLowerCase();
    card.style.display = title.includes(keyword) || content.includes(keyword) ? 'block' : 'none';
  });
}

// ==================== UI ====================
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('darkMode', !isDark);
  showToast(isDark ? '☀️ Light mode!' : '🌙 Dark mode!', 'info');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function toggleForm(id) {
  const form = document.getElementById(id);
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// ==================== AVATAR ====================
async function uploadAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB', 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    try {
      const res = await fetch(`${API}/auth/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: base64 })
      });
      if (res.ok) {
        user.avatar = base64;
        localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('avatar-display').innerHTML = `<img src="${base64}" class="avatar-img">`;
        showToast('Cập nhật ảnh đại diện thành công!', 'success');
      }
    } catch (err) {
      showToast('Lỗi upload ảnh!', 'error');
    }
  };
  reader.readAsDataURL(file);
}

// ==================== PROFILE ====================
async function updateProfile() {
  const username = document.getElementById('new-username').value.trim();
  const email = document.getElementById('new-email').value.trim();
  if (!username && !email) {
    showToast('Vui lòng điền ít nhất một thông tin!', 'warning');
    return;
  }
  try {
    const res = await fetch(`${API}/auth/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, email })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Cập nhật thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  if (!currentPassword || !newPassword) {
    showToast('Vui lòng điền đầy đủ!', 'warning');
    return;
  }
  if (newPassword.length < 6) {
    showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
    return;
  }
  try {
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Đổi mật khẩu thành công!', 'success');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối server!', 'error');
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}
// ==================== TRASH ====================
async function toggleTrash() {
  document.getElementById('trash-modal').style.display = 'flex';
  loadTrash();
}

function closeTrashModal() {
  document.getElementById('trash-modal').style.display = 'none';
}

async function loadTrash() {
  try {
    const res = await fetch(`${API}/notes/trash`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notes = await res.json();
    const grid = document.getElementById('trash-grid');

    // Cập nhật số lượng thùng rác
    document.getElementById('trash-count').textContent = notes.length;

    if (notes.length === 0) {
      grid.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Thùng rác trống!</p>';
      return;
    }

    grid.innerHTML = notes.map(note => `
      <div style="background:var(--card-bg); padding:16px; border-radius:8px; border-left:4px solid #e53e3e;">
        <h4 style="color:var(--text); margin-bottom:6px;">${note.title}</h4>
        <p style="color:var(--text-muted); font-size:13px; margin-bottom:8px;">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
        <p style="color:#e53e3e; font-size:11px; margin-bottom:10px;">
          🗑️ Xóa lúc: ${new Date(note.deletedAt).toLocaleDateString('vi-VN')}
        </p>
        <div style="display:flex; gap:8px;">
          <button onclick="restoreNote('${note._id}')" 
                  style="padding:5px 12px; background:#d1fae5; color:#38a169; border:none; border-radius:6px; cursor:pointer; font-size:13px;">
            ♻️ Khôi phục
          </button>
          <button onclick="permanentDelete('${note._id}')"
                  style="padding:5px 12px; background:#fff5f5; color:#e53e3e; border:none; border-radius:6px; cursor:pointer; font-size:13px;">
            ❌ Xóa vĩnh viễn
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showToast('Lỗi tải thùng rác!', 'error');
  }
}

async function restoreNote(id) {
  try {
    const res = await fetch(`${API}/notes/${id}/restore`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Đã khôi phục ghi chú!', 'success');
      loadTrash();
      loadNotes(activeTag);
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi khôi phục!', 'error');
  }
}

async function permanentDelete(id) {
  if (!confirm('Xóa vĩnh viễn? Không thể hoàn tác!')) return;
  try {
    const res = await fetch(`${API}/notes/${id}/permanent`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Đã xóa vĩnh viễn!', 'success');
      loadTrash();
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi xóa!', 'error');
  }
}

async function emptyTrash() {
  if (!confirm('Dọn sạch toàn bộ thùng rác? Không thể hoàn tác!')) return;
  try {
    const res = await fetch(`${API}/notes/trash/empty`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Đã dọn sạch thùng rác!', 'success');
      loadTrash();
      loadStats();
    }
  } catch (err) {
    showToast('Lỗi dọn thùng rác!', 'error');
  }
}
// ==================== EXPORT ====================
function toggleExportMenu() {
  const menu = document.getElementById('export-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

async function getAllNotes() {
  try {
    const res = await fetch(`${API}/notes?limit=1000`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.notes;
  } catch (err) {
    showToast('Lỗi tải ghi chú!', 'error');
    return [];
  }
}

async function exportTXT() {
  showToast('Đang xuất file TXT...', 'info');
  const notes = await getAllNotes();
  if (notes.length === 0) {
    showToast('Không có ghi chú để export!', 'warning');
    return;
  }

  let content = `NOTEAPP - DANH SÁCH GHI CHÚ\n`;
  content += `Xuất lúc: ${new Date().toLocaleString('vi-VN')}\n`;
  content += `Tổng số: ${notes.length} ghi chú\n`;
  content += `${'='.repeat(50)}\n\n`;

  notes.forEach((note, index) => {
    content += `${index + 1}. ${note.title}\n`;
    content += `${'─'.repeat(40)}\n`;
    content += `${note.content}\n`;
    if (note.tags?.length) {
      content += `Tags: ${note.tags.map(t => '#' + t).join(', ')}\n`;
    }
    content += `Ngày tạo: ${new Date(note.createdAt).toLocaleDateString('vi-VN')}\n`;
    if (note.isPinned) content += `📌 Đã ghim\n`;
    content += `\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `noteapp_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất file TXT thành công!', 'success');
}

async function exportPDF() {
  showToast('Đang chuẩn bị in PDF...', 'info');
  const notes = await getAllNotes();
  if (notes.length === 0) {
    showToast('Không có ghi chú để export!', 'warning');
    return;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>NoteApp - Export PDF</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
        h1 { color: #4f46e5; text-align: center; margin-bottom: 8px; }
        .meta { text-align: center; color: #666; font-size: 13px; margin-bottom: 24px; }
        .note { padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; break-inside: avoid; }
        .note-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 8px; }
        .note-content { font-size: 14px; color: #555; line-height: 1.6; white-space: pre-wrap; }
        .note-tags { margin-top: 8px; }
        .tag { display: inline-block; padding: 2px 8px; background: #4f46e5; color: white; border-radius: 10px; font-size: 11px; margin-right: 4px; }
        .note-meta { font-size: 11px; color: #999; margin-top: 8px; }
        .pinned { border-left: 4px solid #f6ad55; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>📝 NoteApp</h1>
      <p class="meta">Xuất lúc: ${new Date().toLocaleString('vi-VN')} | Tổng số: ${notes.length} ghi chú</p>
      ${notes.map((note, i) => `
        <div class="note ${note.isPinned ? 'pinned' : ''}" style="background:${note.color || '#fff'}">
          <div class="note-title">${i + 1}. ${note.title} ${note.isPinned ? '📌' : ''}</div>
          <div class="note-content">${note.content}</div>
          ${note.tags?.length ? `
            <div class="note-tags">
              ${note.tags.map(t => `<span class="tag">#${t}</span>`).join('')}
            </div>` : ''}
          <div class="note-meta">📅 ${new Date(note.createdAt).toLocaleDateString('vi-VN')}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
  showToast('Đã mở cửa sổ in PDF!', 'success');
}
// ==================== PWA ====================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-btn').style.display = 'block';
});

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  if (result.outcome === 'accepted') {
    showToast('Đã cài đặt NoteApp!', 'success');
    document.getElementById('install-btn').style.display = 'none';
  }
  deferredPrompt = null;
}

window.addEventListener('appinstalled', () => {
  showToast('NoteApp đã được cài đặt!', 'success');
  document.getElementById('install-btn').style.display = 'none';
});
 
// ==================== REMINDER ====================
async function initPushNotification() {
  try {
    const res = await fetch(`${API}/auth/vapid-public-key`);
    const { publicKey } = await res.json();
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    await fetch(`${API}/auth/push-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ subscription: sub })
    });
    console.log('✅ Push subscription saved');
  } catch (err) {
    console.error('Push init error:', err);
  }
}
 
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
 
async function setReminder(noteId, reminderAt) {
  try {
    const res = await fetch(`${API}/notes/${noteId}/reminder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reminderAt })
    });
    if (res.ok) {
      showToast(reminderAt ? '⏰ Đã đặt nhắc nhở!' : '🗑️ Đã xóa nhắc nhở!', 'success');
      loadReminders();
    }
  } catch (err) {
    showToast('Lỗi đặt nhắc nhở!', 'error');
  }
}
 
async function loadReminders() {
  try {
    const res = await fetch(`${API}/notes/reminders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notes = await res.json();
    const container = document.getElementById('reminders-list');
    if (!container) return;
 
    if (notes.length === 0) {
      container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Chưa có nhắc nhở nào</p>';
      return;
    }
 
    container.innerHTML = notes.map(note => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-secondary); border-radius:10px; margin-bottom:10px;">
        <div>
          <div style="font-weight:600; margin-bottom:4px;">${note.title}</div>
          <div style="font-size:12px; color:var(--text-secondary);">⏰ ${new Date(note.reminderAt).toLocaleString('vi-VN')}</div>
          <div style="font-size:11px; margin-top:4px;">
            ${note.reminderSent
              ? '<span style="color:#22c55e;">✅ Đã gửi</span>'
              : '<span style="color:#f59e0b;">⏳ Chờ gửi</span>'}
          </div>
        </div>
        <button onclick="setReminder('${note._id}', null)" style="background:#e53e3e; color:white; border:none; border-radius:8px; padding:6px 10px; cursor:pointer;">🗑️</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Load reminders error:', err);
  }
}
 
function showReminders() {
  const modal = document.getElementById('reminder-modal');
  modal.style.display = 'flex';
  loadReminders();
}
 
function closeReminders() {
  document.getElementById('reminder-modal').style.display = 'none';
}
 
function showReminderPicker(noteId) {
  const existing = document.getElementById(`reminder-picker-${noteId}`);
  if (existing) { existing.remove(); return; }
 
  const picker = document.createElement('div');
  picker.id = `reminder-picker-${noteId}`;
  picker.style.cssText = 'position:absolute; z-index:100; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:10px; box-shadow:0 4px 12px rgba(0,0,0,0.15); margin-top:4px;';
  picker.innerHTML = `
    <label style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Chọn thời gian nhắc nhở:</label>
    <input type="datetime-local" id="dt-${noteId}" style="border:1px solid var(--border); border-radius:6px; padding:4px 8px; font-size:13px; color:var(--text); background:var(--bg);">
    <div style="display:flex; gap:6px; margin-top:8px;">
      <button onclick="confirmReminder('${noteId}')" style="background:#4f46e5; color:white; border:none; border-radius:6px; padding:4px 10px; cursor:pointer; font-size:12px;">✅ Đặt</button>
      <button onclick="document.getElementById('reminder-picker-${noteId}').remove()" style="background:var(--bg-secondary); border:1px solid var(--border); border-radius:6px; padding:4px 10px; cursor:pointer; font-size:12px;">✕</button>
    </div>
  `;
 
  const btn = document.getElementById(`remind-btn-${noteId}`);
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(picker);
}
 
function confirmReminder(noteId) {
  const dt = document.getElementById(`dt-${noteId}`).value;
  if (!dt) { showToast('Vui lòng chọn thời gian!', 'error'); return; }
  const reminderAt = new Date(dt).toISOString();
  setReminder(noteId, reminderAt);
  document.getElementById(`reminder-picker-${noteId}`).remove();
}
 
// Khởi tạo push notification khi load app
if ('Notification' in window && 'serviceWorker' in navigator) {
  initPushNotification();
}
