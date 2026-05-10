const API = 'https://noteapp-backend-goqh.onrender.com/api';
const token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
let selectedColor = '#ffffff';
let activeTag = null;
let activeFolder = null;
let currentPage = 1;
const NOTES_PER_PAGE = 6;
if (!token) window.location.href = 'index.html';
 
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.setAttribute('data-theme', 'dark');
}
 
document.getElementById('username-display').textContent = user?.username || 'User';
if (user?.avatar) {
  document.getElementById('avatar-display').innerHTML = `<img src="${user.avatar}" class="avatar-img">`;
}
 
loadNotes();
loadStats();
loadFolders();
 
// ==================== TOAST ====================
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
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
 
// ==================== SKELETON ====================
function showSkeleton() {
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  grid.innerHTML = Array(6).fill(0).map(() =>
    '<div class="skeleton-card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div></div>'
  ).join('');
}
 
// ==================== FOLDER ====================
async function loadFolders() {
  try {
    const res = await fetch(`${API}/notes/folders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const folders = await res.json();
    const container = document.getElementById('folder-list');
    if (!container) return;
    container.innerHTML = `
      <div onclick="filterByFolder(null)" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;font-size:14px;${!activeFolder ? 'background:var(--primary);color:white;' : 'color:var(--text);'}">
        📁 Tất cả
      </div>
      ${folders.map(f => `
        <div onclick="filterByFolder('${f}')" style="padding:8px 12px;cursor:pointer;border-radius:8px;margin-bottom:4px;font-size:14px;${activeFolder === f ? 'background:var(--primary);color:white;' : 'color:var(--text);'}">
          📂 ${f}
        </div>
      `).join('')}
    `;
  } catch (err) { console.error('Load folders error:', err); }
}
 
function filterByFolder(folder) {
  activeFolder = folder;
  loadFolders();
  loadNotes(activeTag, 1);
}
 
// ==================== COUNTDOWN ====================
function getCountdown(reminderAt) {
  const now = new Date();
  const remind = new Date(reminderAt);
  const diff = remind - now;
  if (diff < 0) return '<span style="color:#e53e3e;font-weight:600;">⚠️ Đã quá hạn!</span>';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours < 1) return `<span style="color:#e53e3e;">⏳ Còn ${mins} phút nữa!</span>`;
  if (hours < 24) return `<span style="color:#f59e0b;">⏳ Còn ${hours} giờ ${mins} phút nữa</span>`;
  const days = Math.floor(hours / 24);
  return `<span style="color:#10b981;">⏳ Còn ${days} ngày nữa</span>`;
}
 
function getPriorityBadge(priority) {
  const map = { high: '🔴 Cao', medium: '🟡 Trung bình', low: '🟢 Thấp' };
  return priority ? `<span style="font-size:11px;margin-bottom:4px;display:block;">${map[priority] || ''}</span>` : '';
}
 
// ==================== NOTES ====================
async function loadNotes(tag = null, page = 1) {
  try {
    currentPage = page;
    showSkeleton();
    let url = `${API}/notes?page=${page}&limit=${NOTES_PER_PAGE}`;
    if (tag) url += `&tag=${tag}`;
    if (activeFolder) url += `&folder=${encodeURIComponent(activeFolder)}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.status === 401) { localStorage.clear(); window.location.href = 'index.html'; return; }
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
    grid.innerHTML = '<p class="empty-state">🔭 Chưa có ghi chú nào!</p>';
    return;
  }
  grid.innerHTML = notes.map(note => {
    const id = note._id;
    const title = note.title;
    const content = note.content;
    const color = note.color || '#ffffff';
    const tags = note.tags || [];
    const folder = note.folder || 'Chung';
    const isOverdue = note.reminderAt && new Date(note.reminderAt) < new Date();
    return `
    <div class="note-card ${note.isPinned ? 'pinned' : ''} ${isOverdue ? 'overdue' : ''}" id="note-${id}" style="background:${color};${isOverdue ? 'border:2px solid #e53e3e;' : ''}">
      <div class="note-card-header">
        <h4>${title}</h4>
        <span class="pin-icon ${note.isPinned ? 'active' : ''}" onclick="togglePin('${id}', ${note.isPinned})" title="${note.isPinned ? 'Bỏ ghim' : 'Ghim'}">📌</span>
      </div>
      <p>${content}</p>
      ${tags.length ? `<div class="note-tags">${tags.map(t => `<span class="note-tag">#${t}</span>`).join('')}</div>` : ''}
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">📂 ${folder}</div>
      ${getPriorityBadge(note.priority)}
      <p class="note-date">${new Date(note.createdAt).toLocaleDateString('vi-VN')}</p>
      ${note.reminderAt ? `
        <div style="font-size:11px;margin-bottom:6px;">
          ⏰ ${new Date(note.reminderAt).toLocaleString('vi-VN')}${note.reminderSent ? ' ✅' : ''}
          <br>${getCountdown(note.reminderAt)}
        </div>` : ''}
      <div class="note-card-actions">
        <button class="btn-edit" onclick="editNote('${id}', this)">✏️ Sửa</button>
        <button class="btn-delete" onclick="deleteNote('${id}')">🗑️ Xóa</button>
        <button class="btn-share ${note.isShared ? 'shared' : ''}" onclick="toggleShare('${id}', ${note.isShared}, '${note.shareId}')">
          ${note.isShared ? '🔗 Đã chia sẻ' : '📤 Chia sẻ'}
        </button>
        <button onclick="showHistory('${id}')" style="background:#6366f1;color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">Lich su</button>
        <button onclick="${note.isPrivate ? `unlockNote('${id}')` : `showPrivacyModal('${id}', false)`}" style="background:${note.isPrivate ? '#e53e3e' : '#38a169'};color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px;">${note.isPrivate ? '🔒 Khóa' : '🔓 Khóa'}</button>
        <button id="remind-btn-${id}" onclick="showReminderPicker('${id}')" title="Đặt nhắc nhở" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px;">⏰</button>
      </div>
    </div>`;
  }).join('');
  window._notesData = notes;
}
 
function editNote(id, btn) {
  const note = window._notesData.find(n => n._id === id);
  if (!note) return;
  document.getElementById('note-title').value = note.title;
  setEditorContent(note.content);
  document.getElementById('note-tags').value = (note.tags || []).join(',');
  const folderInput = document.getElementById('note-folder');
  if (folderInput) folderInput.value = note.folder || 'Chung';
  selectedColor = note.color || '#ffffff';
  document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('selected', o.dataset.color === selectedColor));
  const submitBtn = document.querySelector('.btn-primary');
  submitBtn.textContent = '💾 Cập nhật';
  submitBtn.onclick = () => updateNote(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
function renderTagsFilter(notes) {
  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];
  const container = document.getElementById('tags-filter');
  if (allTags.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <button class="tag-filter-btn ${activeTag === null ? 'active' : ''}" onclick="filterByTag(null)">Tất cả</button>
    ${allTags.map(t => `<button class="tag-filter-btn ${activeTag === t ? 'active' : ''}" onclick="filterByTag('${t}')">#${t}</button>`).join('')}
  `;
}
 
function renderPagination(totalPages, currentPage, tag) {
  const container = document.getElementById('pagination');
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `<button class="page-btn" onclick="loadNotes('${tag}', ${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Trước</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="loadNotes('${tag}', ${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="page-info">...</span>`;
    }
  }
  html += `<button class="page-btn" onclick="loadNotes('${tag}', ${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Sau →</button>`;
  html += `<span class="page-info">Trang ${currentPage}/${totalPages}</span>`;
  container.innerHTML = html;
}
 
function filterByTag(tag) { activeTag = tag; loadNotes(tag, 1); }
 
async function loadStats() {
  try {
    const res = await fetch(`${API}/notes/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
    const stats = await res.json();
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-pinned').textContent = stats.pinned;
    document.getElementById('stat-shared').textContent = stats.shared;
    document.getElementById('stat-tags').textContent = stats.totalTags;
  } catch (err) { console.error('Lỗi load stats:', err); }
}
 
function selectColor(el) {
  document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedColor = el.dataset.color;
}
 
// ==================== RICH TEXT EDITOR ====================
function formatText(command) { document.execCommand(command, false, null); document.getElementById('note-content').focus(); }
function formatBlock(tag) { document.execCommand('formatBlock', false, tag); document.getElementById('note-content').focus(); }
function clearFormat() { document.execCommand('removeFormat', false, null); document.getElementById('note-content').focus(); }
function getEditorContent() { return document.getElementById('note-content').innerHTML; }
function setEditorContent(html) { document.getElementById('note-content').innerHTML = html; }
function clearEditor() { document.getElementById('note-content').innerHTML = ''; }
 
// ==================== MARKDOWN PREVIEW ====================
function toggleMarkdownPreview() {
  const editor = document.getElementById('note-content');
  const btn = document.getElementById('preview-btn');
  let previewDiv = document.getElementById('markdown-preview');
  if (!previewDiv) {
    previewDiv = document.createElement('div');
    previewDiv.id = 'markdown-preview';
    previewDiv.style.cssText = 'min-height:150px;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--bg-secondary);display:none;line-height:1.6;';
    editor.parentNode.insertBefore(previewDiv, editor.nextSibling);
  }
  if (editor.style.display !== 'none') {
    previewDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(editor.innerText || '*Chưa có nội dung*') : editor.innerText;
    previewDiv.style.display = 'block';
    editor.style.display = 'none';
    btn.textContent = '✏️ Edit';
  } else {
    previewDiv.style.display = 'none';
    editor.style.display = 'block';
    btn.textContent = '👁️ Preview';
  }
}
 
// ==================== IMAGE IN NOTE ====================
async function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Ảnh quá lớn! Tối đa 5MB', 'warning'); return; }
  showToast('Đang upload ảnh...', 'info');
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API}/notes/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      const editor = document.getElementById('note-content');
      editor.focus();
      document.execCommand('insertHTML', false, `<img src="${data.url}" style="max-width:100%;border-radius:8px;margin:8px 0;" />`);
      showToast('Đã chèn ảnh!', 'success');
    } else { showToast('Lỗi upload ảnh!', 'error'); }
  } catch (err) { showToast('Lỗi kết nối!', 'error'); }
  event.target.value = '';
}
 
// ==================== CRUD NOTES ====================
async function createNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = getEditorContent().trim();
  const tagsInput = document.getElementById('note-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
  const folderInput = document.getElementById('note-folder');
  const folder = folderInput ? (folderInput.value.trim() || 'Chung') : 'Chung';
  if (!title || !content || content === '<br>') { showToast('Vui lòng điền tiêu đề và nội dung!', 'warning'); return; }
  try {
    const res = await fetch(`${API}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, content, tags, color: selectedColor, folder })
    });
    if (res.ok) {
      document.getElementById('note-title').value = '';
      document.getElementById('note-tags').value = '';
      if (folderInput) folderInput.value = '';
      clearEditor();
      showToast('Tạo ghi chú thành công!', 'success');
      loadNotes(activeTag); loadStats(); loadFolders();
    }
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
async function updateNote(id) {
  const title = document.getElementById('note-title').value.trim();
  const content = getEditorContent().trim();
  const tagsInput = document.getElementById('note-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
  const folderInput = document.getElementById('note-folder');
  const folder = folderInput ? (folderInput.value.trim() || 'Chung') : 'Chung';
  try {
    const res = await fetch(`${API}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, content, tags, color: selectedColor, folder })
    });
    if (res.ok) {
      document.getElementById('note-title').value = '';
      document.getElementById('note-tags').value = '';
      if (folderInput) folderInput.value = '';
      clearEditor();
      const btn = document.querySelector('.btn-primary');
      btn.textContent = '➕ Thêm ghi chú';
      btn.onclick = createNote;
      showToast('Cập nhật ghi chú thành công!', 'success');
      loadNotes(activeTag); loadStats(); loadFolders();
    }
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
async function deleteNote(id) {
  if (!confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
  try {
    const res = await fetch(`${API}/notes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { showToast('Xóa ghi chú thành công!', 'success'); loadNotes(activeTag); loadStats(); loadFolders(); }
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
async function togglePin(id, isPinned) {
  try {
    await fetch(`${API}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isPinned: !isPinned })
    });
    showToast(isPinned ? 'Đã bỏ ghim!' : 'Đã ghim ghi chú!', 'info');
    loadNotes(activeTag); loadStats();
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
async function toggleShare(id, isShared, shareId) {
  try {
    const res = await fetch(`${API}/notes/${id}/share`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    const note = await res.json();
    if (note.isShared) { showShareModal(note.shareId); } else { showToast('Đã tắt chia sẻ ghi chú!', 'info'); }
    loadNotes(activeTag); loadStats();
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
function showShareModal(shareId) {
  const link = `https://noteapp-hungson.vercel.app/share.html?id=${shareId}`;
  document.getElementById('share-link-input').value = link;
  document.getElementById('share-modal').style.display = 'flex';
}
function closeShareModal() { document.getElementById('share-modal').style.display = 'none'; }
function copyShareLink() { navigator.clipboard.writeText(document.getElementById('share-link-input').value); showToast('Đã copy link chia sẻ!', 'success'); }
 
// ==================== SEARCH ====================
let searchTimeout = null;
async function searchNotes(q) {
  if (!q.trim()) { loadNotes(activeTag, 1); return; }
  try {
    const res = await fetch(`${API}/notes/search?q=${encodeURIComponent(q)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notes = await res.json();
    const grid = document.getElementById('notes-grid');
    if (!notes.length) { grid.innerHTML = '<p class="empty-state">🔍 Không tìm thấy kết quả</p>'; return; }
    grid.innerHTML = notes.map(note => `
      <div class="note-card" id="note-${note._id}" style="background:${note.color || '#fff'}">
        <div class="note-card-header"><h4>${note.title}</h4></div>
        <p>${note.content}</p>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">📂 ${note.folder || 'Chung'}</div>
        <p class="note-date">${new Date(note.createdAt).toLocaleDateString('vi-VN')}</p>
        <div class="note-card-actions">
          <button class="btn-edit" onclick="editNote('${note._id}', this)">✏️ Sửa</button>
          <button class="btn-delete" onclick="deleteNote('${note._id}')">🗑️ Xóa</button>
        </div>
      </div>`).join('');
  } catch(e) { console.error(e); }
}
 
// ==================== UI ====================
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('darkMode', !isDark);
  showToast(isDark ? '☀️ Light mode!' : '🌙 Dark mode!', 'info');
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleForm(id) { const f = document.getElementById(id); f.style.display = f.style.display === 'none' ? 'block' : 'none'; }
 
// ==================== AVATAR ====================
async function uploadAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB', 'warning'); return; }
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`${API}/auth/avatar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      const avatarUrl = data.user.avatar;
      user.avatar = avatarUrl;
      localStorage.setItem('user', JSON.stringify(user));
      document.getElementById('avatar-display').innerHTML = `<img src="${avatarUrl}" class="avatar-img">`;
      showToast('Cập nhật ảnh đại diện thành công!', 'success');
    } else { showToast('Lỗi upload ảnh!', 'error'); }
  } catch (err) { showToast('Lỗi upload ảnh!', 'error'); }
}
 
// ==================== PROFILE ====================
async function updateProfile() {
  const username = document.getElementById('new-username').value.trim();
  const email = document.getElementById('new-email').value.trim();
  if (!username && !email) { showToast('Vui lòng điền ít nhất một thông tin!', 'warning'); return; }
  try {
    const res = await fetch(`${API}/auth/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username, email })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Cập nhật thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => { localStorage.clear(); window.location.href = 'index.html'; }, 1500);
    } else { showToast(data.message, 'error'); }
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
async function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  if (!currentPassword || !newPassword) { showToast('Vui lòng điền đầy đủ!', 'warning'); return; }
  if (newPassword.length < 6) { showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning'); return; }
  try {
    const res = await fetch(`${API}/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Đổi mật khẩu thành công!', 'success');
      setTimeout(() => { localStorage.clear(); window.location.href = 'index.html'; }, 1500);
    } else { showToast(data.message, 'error'); }
  } catch (err) { showToast('Lỗi kết nối server!', 'error'); }
}
 
function logout() { localStorage.clear(); window.location.href = 'index.html'; }
 
// ==================== TRASH ====================
async function toggleTrash() { document.getElementById('trash-modal').style.display = 'flex'; loadTrash(); }
function closeTrashModal() { document.getElementById('trash-modal').style.display = 'none'; }
 
async function loadTrash() {
  try {
    const res = await fetch(`${API}/notes/trash`, { headers: { 'Authorization': `Bearer ${token}` } });
    const notes = await res.json();
    const grid = document.getElementById('trash-grid');
    document.getElementById('trash-count').textContent = notes.length;
    if (notes.length === 0) { grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Thùng rác trống!</p>'; return; }
    grid.innerHTML = notes.map(note => `
      <div style="background:var(--card-bg);padding:16px;border-radius:8px;border-left:4px solid #e53e3e;">
        <h4 style="color:var(--text);margin-bottom:6px;">${note.title}</h4>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:8px;">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
        <p style="color:#e53e3e;font-size:11px;margin-bottom:10px;">🗑️ Xóa lúc: ${new Date(note.deletedAt).toLocaleDateString('vi-VN')}</p>
        <div style="display:flex;gap:8px;">
          <button onclick="restoreNote('${note._id}')" style="padding:5px 12px;background:#d1fae5;color:#38a169;border:none;border-radius:6px;cursor:pointer;font-size:13px;">♻️ Khôi phục</button>
          <button onclick="permanentDelete('${note._id}')" style="padding:5px 12px;background:#fff5f5;color:#e53e3e;border:none;border-radius:6px;cursor:pointer;font-size:13px;">❌ Xóa vĩnh viễn</button>
        </div>
      </div>
    `).join('');
  } catch (err) { showToast('Lỗi tải thùng rác!', 'error'); }
}
 
async function restoreNote(id) {
  try {
    const res = await fetch(`${API}/notes/${id}/restore`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { showToast('Đã khôi phục ghi chú!', 'success'); loadTrash(); loadNotes(activeTag); loadStats(); }
  } catch (err) { showToast('Lỗi khôi phục!', 'error'); }
}
 
async function permanentDelete(id) {
  if (!confirm('Xóa vĩnh viễn? Không thể hoàn tác!')) return;
  try {
    const res = await fetch(`${API}/notes/${id}/permanent`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { showToast('Đã xóa vĩnh viễn!', 'success'); loadTrash(); loadStats(); }
  } catch (err) { showToast('Lỗi xóa!', 'error'); }
}
 
async function emptyTrash() {
  if (!confirm('Dọn sạch toàn bộ thùng rác? Không thể hoàn tác!')) return;
  try {
    const res = await fetch(`${API}/notes/trash/empty`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { showToast('Đã dọn sạch thùng rác!', 'success'); loadTrash(); loadStats(); }
  } catch (err) { showToast('Lỗi dọn thùng rác!', 'error'); }
}
 
// ==================== EXPORT ====================
function toggleExportMenu() { const m = document.getElementById('export-menu'); m.style.display = m.style.display === 'none' ? 'block' : 'none'; }
 
async function getAllNotes() {
  try {
    const res = await fetch(`${API}/notes?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    return data.notes;
  } catch (err) { showToast('Lỗi tải ghi chú!', 'error'); return []; }
}
 
async function exportTXT() {
  showToast('Đang xuất file TXT...', 'info');
  const notes = await getAllNotes();
  if (notes.length === 0) { showToast('Không có ghi chú để export!', 'warning'); return; }
  let content = `NOTEAPP - DANH SACH GHI CHU\nXuat luc: ${new Date().toLocaleString('vi-VN')}\nTong so: ${notes.length} ghi chu\n${'='.repeat(50)}\n\n`;
  notes.forEach((note, i) => {
    content += `${i + 1}. ${note.title}\n${'─'.repeat(40)}\n${note.content}\n`;
    if (note.tags?.length) content += `Tags: ${note.tags.map(t => '#' + t).join(', ')}\n`;
    content += `Folder: ${note.folder || 'Chung'}\nNgay tao: ${new Date(note.createdAt).toLocaleDateString('vi-VN')}\n${note.isPinned ? 'Da ghim\n' : ''}\n`;
  });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `noteapp_${new Date().toISOString().slice(0,10)}.txt`; a.click();
  URL.revokeObjectURL(url);
  showToast('Đã xuất file TXT thành công!', 'success');
}
 
async function exportPDF() {
  showToast('Đang chuẩn bị in PDF...', 'info');
  const notes = await getAllNotes();
  if (notes.length === 0) { showToast('Không có ghi chú để export!', 'warning'); return; }
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>NoteApp - Export PDF</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:20px;color:#333}h1{color:#4f46e5;text-align:center}.note{padding:16px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:16px;break-inside:avoid}.note-title{font-size:18px;font-weight:bold;margin-bottom:8px}.note-content{font-size:14px;color:#555;line-height:1.6;white-space:pre-wrap}.tag{display:inline-block;padding:2px 8px;background:#4f46e5;color:white;border-radius:10px;font-size:11px;margin-right:4px}.pinned{border-left:4px solid #f6ad55}</style>
    </head><body><h1>NoteApp</h1><p style="text-align:center;color:#666">Xuat luc: ${new Date().toLocaleString('vi-VN')} | Tong: ${notes.length} ghi chu</p>
    ${notes.map((n,i) => `<div class="note ${n.isPinned?'pinned':''}" style="background:${n.color||'#fff'}"><div class="note-title">${i+1}. ${n.title}${n.isPinned?' (Da ghim)':''}</div><div class="note-content">${n.content}</div>${n.tags?.length?`<div style="margin-top:8px">${n.tags.map(t=>`<span class="tag">#${t}</span>`).join('')}</div>`:''}<div style="font-size:11px;color:#999;margin-top:8px">Folder: ${n.folder||'Chung'} | ${new Date(n.createdAt).toLocaleDateString('vi-VN')}</div></div>`).join('')}
    </body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
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
  if (result.outcome === 'accepted') { showToast('Da cai dat NoteApp!', 'success'); document.getElementById('install-btn').style.display = 'none'; }
  deferredPrompt = null;
}
window.addEventListener('appinstalled', () => { showToast('NoteApp da duoc cai dat!', 'success'); document.getElementById('install-btn').style.display = 'none'; });
 
// ==================== REMINDER ====================
async function initPushNotification() {
  try {
    const res = await fetch(`${API}/auth/vapid-public-key`);
    const { publicKey } = await res.json();
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    await fetch(`${API}/auth/push-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ subscription: sub })
    });
  } catch (err) { console.error('Push init error:', err); }
}
 
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
 
async function setReminder(noteId, reminderAt, priority = 'medium') {
  try {
    const res = await fetch(`${API}/notes/${noteId}/reminder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reminderAt, priority })
    });
    if (res.ok) { showToast(reminderAt ? 'Đã đặt nhắc nhở!' : 'Đã xóa nhắc nhở!', 'success'); loadReminders(); loadNotes(activeTag); }
  } catch (err) { showToast('Lỗi đặt nhắc nhở!', 'error'); }
}
 
async function loadReminders() {
  try {
    const res = await fetch(`${API}/notes/reminders`, { headers: { 'Authorization': `Bearer ${token}` } });
    const notes = await res.json();
    const container = document.getElementById('reminders-list');
    if (!container) return;
    if (notes.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">Chưa có nhắc nhở nào</p>'; return; }
    const priorityMap = { high: '🔴 Cao', medium: '🟡 Trung bình', low: '🟢 Thấp' };
    container.innerHTML = notes.map(note => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-secondary);border-radius:10px;margin-bottom:10px;border-left:4px solid ${note.priority==='high'?'#e53e3e':note.priority==='low'?'#10b981':'#f59e0b'}">
        <div>
          <div style="font-weight:600;margin-bottom:4px;">${note.title}</div>
          <div style="font-size:12px;color:var(--text-secondary);">⏰ ${new Date(note.reminderAt).toLocaleString('vi-VN')}</div>
          <div style="font-size:11px;margin-top:2px;">${priorityMap[note.priority] || '🟡 Trung bình'}</div>
          <div style="font-size:11px;margin-top:4px;">${getCountdown(note.reminderAt)}</div>
          <div style="font-size:11px;margin-top:2px;">${note.reminderSent ? '<span style="color:#22c55e;">Đã gửi</span>' : '<span style="color:#f59e0b;">Chờ gửi</span>'}</div>
        </div>
        <button onclick="setReminder('${note._id}', null)" style="background:#e53e3e;color:white;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;">🗑️</button>
      </div>
    `).join('');
  } catch (err) { console.error('Load reminders error:', err); }
}
 
function showReminders() { document.getElementById('reminder-modal').style.display = 'flex'; loadReminders(); }
function closeReminders() { document.getElementById('reminder-modal').style.display = 'none'; }
 
function showReminderPicker(noteId) {
  const existing = document.getElementById('reminder-picker-' + noteId);
  if (existing) { existing.remove(); return; }
  const picker = document.createElement('div');
  picker.id = 'reminder-picker-' + noteId;
  picker.style.cssText = 'position:absolute;z-index:100;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);margin-top:4px;min-width:220px;';
  picker.innerHTML =
    '<label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">⏰ Thời gian nhắc nhở:</label>' +
    '<input type="datetime-local" id="dt-' + noteId + '" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:13px;color:var(--text);background:var(--bg);margin-bottom:8px;">' +
    '<label style="font-size:12px;color:var(--text-secondary);display:block;margin-bottom:4px;">🎯 Mức độ ưu tiên:</label>' +
    '<select id="priority-' + noteId + '" style="width:100%;border:1px solid var(--border);border-radius:6px;padding:4px 8px;font-size:13px;color:var(--text);background:var(--bg);margin-bottom:8px;">' +
    '<option value="low">🟢 Thấp</option>' +
    '<option value="medium" selected>🟡 Trung bình</option>' +
    '<option value="high">🔴 Cao</option>' +
    '</select>' +
    '<div style="display:flex;gap:6px;">' +
    '<button onclick="confirmReminder(\'' + noteId + '\')" style="flex:1;background:#4f46e5;color:white;border:none;border-radius:6px;padding:6px;cursor:pointer;font-size:12px;">✅ Đặt</button>' +
    '<button onclick="document.getElementById(\'reminder-picker-' + noteId + '\').remove()" style="flex:1;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;padding:6px;cursor:pointer;font-size:12px;">❌ Hủy</button>' +
    '</div>';
  const btn = document.getElementById('remind-btn-' + noteId);
  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(picker);
}
 
function confirmReminder(noteId) {
  const dt = document.getElementById('dt-' + noteId).value;
  if (!dt) { showToast('Vui lòng chọn thời gian!', 'error'); return; }
  const priority = document.getElementById('priority-' + noteId)?.value || 'medium';
  setReminder(noteId, new Date(dt).toISOString(), priority);
  document.getElementById('reminder-picker-' + noteId).remove();
}
 
if ('Notification' in window && 'serviceWorker' in navigator) {
  initPushNotification();
}
 
// ==================== NOTE HISTORY ====================
async function showHistory(noteId) {
  try {
    const res = await fetch(`${API}/notes/${noteId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const history = await res.json();
    let modal = document.getElementById('history-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'history-modal';
      modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
      modal.innerHTML = '<div style="background:var(--bg);border-radius:16px;padding:24px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h3 style="margin:0;">📜 Lịch sử chỉnh sửa</h3>' +
        '<button onclick="document.getElementById(\'history-modal\').style.display=\'none\'" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>' +
        '</div><div id="history-list"></div></div>';
      document.body.appendChild(modal);
    }
    const list = document.getElementById('history-list');
    if (!history || history.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Chưa có lịch sử chỉnh sửa</p>';
    } else {
      list.innerHTML = history.map((v, i) =>
        '<div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:10px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<strong>' + v.title + '</strong>' +
        '<span style="font-size:12px;color:var(--text-muted);">' + new Date(v.editedAt).toLocaleString('vi-VN') + '</span>' +
        '</div>' +
        '<p style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">' + v.content.substring(0, 100) + (v.content.length > 100 ? '...' : '') + '</p>' +
        '<button onclick="restoreVersion(\'' + noteId + '\', ' + i + ')" style="padding:4px 12px;background:#4f46e5;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">♻️ Khôi phục</button>' +
        '</div>'
      ).join('');
    }
    modal.style.display = 'flex';
  } catch (err) { showToast('Lỗi tải lịch sử!', 'error'); }
}
 
async function restoreVersion(noteId, index) {
  if (!confirm('Khôi phục version này? Nội dung hiện tại sẽ được lưu vào lịch sử.')) return;
  try {
    const res = await fetch(`${API}/notes/${noteId}/history/${index}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Đã khôi phục version!', 'success');
      document.getElementById('history-modal').style.display = 'none';
      loadNotes(activeTag);
    }
  } catch (err) { showToast('Lỗi khôi phục!', 'error'); }
}
 
// ==================== NOTE PRIVACY ====================
function showPrivacyModal(noteId, isPrivate) {
  const pwd = prompt(isPrivate ? 'Nhập mật khẩu hiện tại để xóa:' : 'Nhập mật khẩu mới cho note:');
  if (pwd === null) return;
  if (!pwd.trim()) { showToast('Mật khẩu không được trống!', 'warning'); return; }
  setNotePrivacy(noteId, isPrivate ? null : pwd, isPrivate);
}
 
async function setNotePrivacy(noteId, password, isPrivate) {
  try {
    const res = await fetch(`${API}/notes/${noteId}/privacy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok) { showToast(data.message, 'success'); loadNotes(activeTag); }
    else { showToast(data.message || 'Lỗi!', 'error'); }
  } catch(e) { showToast('Lỗi kết nối!', 'error'); }
}
 
async function unlockNote(noteId) {
  const pwd = prompt('Note này được bảo vệ. Nhập mật khẩu:');
  if (pwd === null) return;
  try {
    const res = await fetch(`${API}/notes/${noteId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('note-title').value = data.note.title;
      setEditorContent(data.note.content);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Đã mở khóa note!', 'success');
    } else { showToast('Sai mật khẩu!', 'error'); }
  } catch(e) { showToast('Lỗi kết nối!', 'error'); }
}
 
// ==================== DASHBOARD ====================
async function showDashboard() {
  try {
    const res = await fetch(`${API}/notes/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    let modal = document.getElementById('dashboard-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'dashboard-modal';
      modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1000;justify-content:center;align-items:center;';
      document.body.appendChild(modal);
    }
    const folderRows = Object.entries(data.byFolder).map(([f,c]) =>
      `<tr><td style="padding:8px;border-bottom:1px solid var(--border)">${f}</td><td style="padding:8px;border-bottom:1px solid var(--border);text-align:center">${c}</td></tr>`
    ).join('');
    modal.innerHTML = `
      <div style="background:var(--bg);border-radius:16px;padding:24px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="margin:0;">📊 Dashboard</h3>
          <button onclick="document.getElementById('dashboard-modal').style.display='none'" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
          <div style="background:var(--primary);color:white;padding:16px;border-radius:12px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;">${data.total}</div>
            <div style="font-size:12px;margin-top:4px;">Tổng ghi chú</div>
          </div>
          <div style="background:#10b981;color:white;padding:16px;border-radius:12px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;">${data.pinned}</div>
            <div style="font-size:12px;margin-top:4px;">Đã ghim</div>
          </div>
          <div style="background:#e53e3e;color:white;padding:16px;border-radius:12px;text-align:center;">
            <div style="font-size:28px;font-weight:bold;">${data.private}</div>
            <div style="font-size:12px;margin-top:4px;">Có mật khẩu</div>
          </div>
        </div>
        <h4 style="margin-bottom:8px;">📂 Theo Folder</h4>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="background:var(--bg-secondary);">
            <th style="padding:8px;text-align:left;">Folder</th>
            <th style="padding:8px;text-align:center;">Số note</th>
          </tr>
          ${folderRows}
        </table>
      </div>`;
    modal.style.display = 'flex';
  } catch(e) { showToast('Lỗi tải dashboard!', 'error'); }
}