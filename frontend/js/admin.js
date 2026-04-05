/* =====================================================
   Smart Campus Events
   js/admin.js  — Admin Dashboard Logic
   ===================================================== */

if (!Session.isLoggedIn() || Session.getRole() !== 'ADMIN') {
  location.href = 'admin-login.html';
}

/* ── State ─────────────────────────────────────────── */
let currentAdmin    = Session.getUser();
let allAdminEvents  = [];
let allAdminRegs    = [];
let allStudents     = [];
let allFeedback     = {};      // eventId -> { list, avg }
let editingEventId  = null;
let deletingEventId = null;
let regFilterStatus = 'ALL';

/* ── Init ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  await loadAll();
  renderHomePage();
});

/* ── Load all data ─────────────────────────────────── */
async function loadAll() {
  try {
    const [evRes, regRes, stuRes] = await Promise.all([
      EventsAPI.getMyEvents(),
      RegistrationsAPI.getAdminAll(),
      AdminAPI.getAllStudents(),
    ]);
    allAdminEvents = evRes.data  || [];
    allAdminRegs   = regRes.data || [];
    allStudents    = stuRes.data || [];
    updatePendingBadge();
  } catch (err) {
    Toast.error('Failed to load data: ' + err.message);
  }
}

function renderNavbar() {
  document.getElementById('navUserName').textContent = currentAdmin.name;
  document.getElementById('navAvatar').textContent   = Fmt.initials(currentAdmin.name);
}

function updatePendingBadge() {
  const pending = allAdminRegs.filter(r => r.status === 'PENDING').length;
  const badge   = document.getElementById('pendingBadge');
  if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-flex'; }
  else badge.style.display = 'none';
}

/* ── Page navigation ───────────────────────────────── */
const PAGES = ['home','events','regs','analytics','students','profile'];
function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).style.display = p === name ? 'block' : 'none';
    document.getElementById('nav-' + p)?.classList.toggle('active', p === name);
  });
  if (name === 'events')    renderMgEvents();
  if (name === 'regs')      renderAdminRegs();
  if (name === 'analytics') renderAnalytics();
  if (name === 'students')  renderStudentsTable();
  if (name === 'profile')   renderAdminProfile();
  window.scrollTo(0, 0);
}

/* ════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════ */
function renderHomePage() {
  const u = currentAdmin;
  document.getElementById('homeTitle').textContent    = `Welcome, ${u.name.split(' ')[0]}! 🏫`;
  document.getElementById('homeSubtitle').textContent = `${u.college} — College Admin Dashboard`;

  const totalRegs   = allAdminRegs.length;
  const pendingRegs = allAdminRegs.filter(r => r.status === 'PENDING').length;
  const revenue     = allAdminRegs.filter(r => r.paymentStatus === 'PAID').reduce((s, r) => s + Number(r.amountPaid || 0), 0);

  document.getElementById('adminStats').innerHTML = [
    [allAdminEvents.length, 'Total Events',         '📅', '#dbeafe','#2563eb'],
    [totalRegs,             'Total Registrations',  '👥', '#d1fae5','#10b981'],
    [pendingRegs,           'Pending Approvals',    '⏳', '#fef3c7','#f59e0b'],
    [`₹${revenue.toLocaleString('en-IN')}`, 'Total Revenue', '💰', '#ede9fe','#8b5cf6'],
  ].map(([v, l, icon, bg, color]) => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${bg};color:${color};">${icon}</div>
      <div><div class="stat-value" style="color:${color};">${v}</div><div class="stat-label">${l}</div></div>
    </div>`).join('');

  // Recent events
  document.getElementById('recentEventsList').innerHTML = allAdminEvents.length
    ? allAdminEvents.slice(0, 5).map(e => `
        <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-weight:600;font-size:0.875rem;">${e.title}</div><div style="font-size:0.75rem;color:var(--text-muted);">${Fmt.date(e.startDate)}</div></div>
          <span class="badge badge-blue">${e.category}</span>
        </div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.875rem;">No events created yet</div>`;

  // Recent regs
  document.getElementById('recentRegsList').innerHTML = allAdminRegs.length
    ? allAdminRegs.slice(-5).reverse().map(r => `
        <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
          <div><div style="font-weight:600;font-size:0.875rem;">${r.studentName}</div><div style="font-size:0.75rem;color:var(--text-muted);">${r.eventTitle}</div></div>
          ${EventHelper.statusBadge(r.status)}
        </div>`).join('')
    : `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.875rem;">No registrations yet</div>`;
}

/* ════════════════════════════════════════════════════
   MANAGE EVENTS
   ════════════════════════════════════════════════════ */
function renderMgEvents() {
  const kw       = (document.getElementById('evMgSearch')?.value || '').toLowerCase();
  const filtered = allAdminEvents.filter(e => e.title.toLowerCase().includes(kw));
  const tbody    = document.getElementById('eventsTableBody');

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-title">No events found</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td>
        <div class="td-name">${e.title}</div>
        <div class="td-sub">${e.college}</div>
      </td>
      <td><span class="badge badge-blue">${e.category}</span></td>
      <td style="font-size:0.8rem;">${Fmt.date(e.startDate)}</td>
      <td>
        <div style="font-size:0.8rem;">${e.filledSlots}/${e.totalSlots}</div>
        <div class="progress" style="margin-top:4px;width:80px;"><div class="progress-bar" style="width:${EventHelper.slotsPercent(e)}%;"></div></div>
      </td>
      <td>${Number(e.fee) > 0 ? `<span class="badge badge-gold">₹${e.fee}</span>` : `<span class="badge badge-green">Free</span>`}</td>
      <td>${EventHelper.statusBadge(e.status)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-icon btn-secondary" title="Edit" onclick="openEventForm(${e.id})">✏️</button>
          <button class="btn btn-icon btn-danger"    title="Delete" onclick="openDeleteConfirm(${e.id},'${e.title.replace(/'/g,"\\'")}')">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

/* ── Event Form Modal ───────────────────────────────── */
function openEventForm(eventId) {
  editingEventId = eventId;
  Form.clearAll('eventFormModal');

  if (eventId) {
    const e = allAdminEvents.find(ev => ev.id === eventId);
    if (!e) return;
    document.getElementById('eventFormTitle').textContent = '✏️ Edit Event';
    Form.setVal('efTitle',  e.title);
    Form.setVal('efDesc',   e.description);
    Form.setVal('efLoc',    e.location);
    Form.setVal('efStart',  e.startDate);
    Form.setVal('efEnd',    e.endDate);
    Form.setVal('efFee',    e.fee);
    Form.setVal('efSlots',  e.totalSlots);
    document.getElementById('efCat').value    = e.category;
    document.getElementById('efStatus').value = e.status;
  } else {
    document.getElementById('eventFormTitle').textContent = '+ Create Event';
    Form.setVal('efTitle',''); Form.setVal('efDesc',''); Form.setVal('efLoc','');
    Form.setVal('efStart',''); Form.setVal('efEnd','');
    Form.setVal('efFee', 0);   Form.setVal('efSlots', 100);
    document.getElementById('efCat').value    = 'HACKATHON';
    document.getElementById('efStatus').value = 'ACTIVE';
  }
  Modal.open('eventFormModal');
}

async function saveEvent() {
  let ok = true;
  const checks = [
    ['efTitle', Validate.required(Form.getVal('efTitle'), 'Title')],
    ['efDesc',  Validate.required(Form.getVal('efDesc'),  'Description')],
    ['efLoc',   Validate.required(Form.getVal('efLoc'),   'Location')],
    ['efStart', Validate.required(Form.getVal('efStart'), 'Start date')],
    ['efEnd',   Validate.required(Form.getVal('efEnd'),   'End date')],
  ];
  checks.forEach(([id, err]) => { if (err) { Form.showError(id, err); ok = false; } });
  if (!ok) return;

  Form.setLoading('saveEventBtn', true, '💾 Save Event');

  const payload = {
    title:       Form.getVal('efTitle'),
    description: Form.getVal('efDesc'),
    category:    document.getElementById('efCat').value,
    location:    Form.getVal('efLoc'),
    startDate:   Form.getVal('efStart'),
    endDate:     Form.getVal('efEnd'),
    fee:         parseFloat(document.getElementById('efFee').value) || 0,
    totalSlots:  parseInt(document.getElementById('efSlots').value) || 100,
    status:      document.getElementById('efStatus').value,
  };

  try {
    if (editingEventId) {
      await EventsAPI.update(editingEventId, payload);
      Toast.success('Event updated ✅');
    } else {
      await EventsAPI.create(payload);
      Toast.success('Event created 🎉');
    }
    Modal.close('eventFormModal');
    await loadAll();
    renderMgEvents();
    renderHomePage();
  } catch (err) {
    Toast.error(err.message || 'Failed to save event');
  } finally {
    Form.setLoading('saveEventBtn', false, '💾 Save Event');
  }
}

/* ── Delete event ────────────────────────────────────── */
function openDeleteConfirm(id, title) {
  deletingEventId = id;
  document.getElementById('deleteEventName').textContent = title;
  Modal.open('deleteConfirmModal');
}

async function confirmDelete() {
  Form.setLoading('confirmDeleteBtn', true, '');
  try {
    await EventsAPI.delete(deletingEventId);
    Modal.close('deleteConfirmModal');
    await loadAll();
    renderMgEvents();
    renderHomePage();
    Toast.success('Event deleted');
  } catch (err) {
    Toast.error(err.message || 'Failed to delete');
    Form.setLoading('confirmDeleteBtn', false, '🗑️ Delete');
  }
}

/* ════════════════════════════════════════════════════
   REGISTRATIONS
   ════════════════════════════════════════════════════ */
function filterAdminRegs(status, btn) {
  regFilterStatus = status;
  document.querySelectorAll('#page-regs .tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderAdminRegs();
}

function renderAdminRegs() {
  const list  = allAdminRegs.filter(r => regFilterStatus === 'ALL' || r.status === regFilterStatus);
  const tbody = document.getElementById('regsTableBody');

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">No registrations found</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td>
        <div class="td-name">${r.studentName}</div>
        <div class="td-sub">${r.studentEmail || ''}</div>
      </td>
      <td>
        <div style="font-size:0.8rem;font-weight:500;">${r.enrollmentNo || '—'}</div>
        <div class="td-sub">${r.studentMobile || ''}</div>
      </td>
      <td>
        <div style="font-size:0.875rem;font-weight:500;">${r.eventTitle}</div>
      </td>
      <td style="font-size:0.78rem;">${Fmt.dateTime(r.registeredAt)}</td>
      <td>${EventHelper.payBadge(r.paymentStatus, r.amountPaid)}</td>
      <td>${EventHelper.statusBadge(r.status)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          ${r.status !== 'APPROVED' ? `<button class="btn btn-icon btn-success" title="Approve" onclick="updateRegStatus(${r.id},'APPROVED')">✅</button>` : ''}
          ${r.status !== 'REJECTED' ? `<button class="btn btn-icon btn-danger"  title="Reject"  onclick="updateRegStatus(${r.id},'REJECTED')">❌</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
}

async function updateRegStatus(regId, status) {
  try {
    await RegistrationsAPI.updateStatus(regId, status);
    await loadAll();
    renderAdminRegs();
    updatePendingBadge();
    renderHomePage();
    Toast.success(`Registration ${status.toLowerCase()} ✅`);
  } catch (err) {
    Toast.error(err.message || 'Failed to update status');
  }
}

/* ════════════════════════════════════════════════════
   FEEDBACK & ANALYTICS
   ════════════════════════════════════════════════════ */
async function renderAnalytics() {
  // Load feedback for all events
  const feedbackByEvent = [];
  for (const e of allAdminEvents) {
    try {
      const res = await FeedbackAPI.getForEvent(e.id);
      if (res.data && res.data.length > 0) {
        feedbackByEvent.push({ event: e, list: res.data, avg: res.averageRating || 0 });
      }
    } catch {}
  }

  const totalFeedback = feedbackByEvent.reduce((s, x) => s + x.list.length, 0);
  const overallAvg    = feedbackByEvent.length
    ? Math.round(feedbackByEvent.reduce((s, x) => s + x.avg, 0) / feedbackByEvent.length * 10) / 10
    : 0;

  document.getElementById('analyticsStats').innerHTML = [
    [totalFeedback,              'Total Feedback', '⭐', '#fef3c7','#f59e0b'],
    [overallAvg || 'N/A',        'Avg Rating',     '📊', '#dbeafe','#2563eb'],
    [feedbackByEvent.length,     'Events Rated',   '📅', '#d1fae5','#10b981'],
  ].map(([v, l, icon, bg, color]) => `
    <div class="stat-card">
      <div class="stat-icon" style="background:${bg};color:${color};">${icon}</div>
      <div><div class="stat-value" style="color:${color};">${v}</div><div class="stat-label">${l}</div></div>
    </div>`).join('');

  if (!feedbackByEvent.length) {
    document.getElementById('analyticsFeedbackList').innerHTML = `<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-title">No feedback yet</div><div class="empty-state-text">Feedback will appear here once students rate your events.</div></div>`;
    return;
  }

  document.getElementById('analyticsFeedbackList').innerHTML = feedbackByEvent.map(({ event: e, list, avg }) => `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <span class="card-title">${e.title}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          ${renderStars(Math.round(avg))}
          <span style="font-weight:800;color:var(--gold);">${avg}/5</span>
          <span style="font-size:0.8rem;color:var(--text-muted);">(${list.length} review${list.length > 1 ? 's' : ''})</span>
        </div>
      </div>
      <div>
        ${list.map(f => `
          <div class="feedback-item">
            <div class="feedback-item-header">
              <div class="feedback-item-title">${f.studentName}</div>
              ${renderStars(f.rating)}
            </div>
            ${f.comment ? `<div class="feedback-comment">${f.comment}</div>` : ''}
            <div class="feedback-meta">${Fmt.dateTime(f.createdAt)}</div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

/* ════════════════════════════════════════════════════
   ALL STUDENTS
   ════════════════════════════════════════════════════ */
function renderStudentsTable() {
  const kw       = (document.getElementById('stuSearch')?.value || '').toLowerCase();
  const filtered = allStudents.filter(s =>
    s.name.toLowerCase().includes(kw) ||
    (s.email || '').toLowerCase().includes(kw) ||
    (s.enrollmentNo || '').toLowerCase().includes(kw) ||
    (s.mobile || '').includes(kw)
  );
  document.getElementById('studentsTitle').textContent = `All Students (${filtered.length})`;

  const tbody = document.getElementById('studentsTableBody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🎓</div><div class="empty-state-title">No students found</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--purple));display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;flex-shrink:0;">${Fmt.initials(s.name)}</div>
          <div><div class="td-name">${s.name}</div><div class="td-sub">${s.email}</div></div>
        </div>
      </td>
      <td><div style="font-size:0.8rem;">${s.enrollmentNo || '—'}</div><div class="td-sub">${s.rollNo || '—'}</div></td>
      <td><div style="font-size:0.875rem;font-weight:500;">${s.course || '—'}</div><div class="td-sub">${s.branch || '—'}</div></td>
      <td style="font-size:0.875rem;">${s.mobile || '—'}</td>
      <td style="font-size:0.875rem;">${s.college || '—'}</td>
      <td><span class="badge badge-blue">Sem ${s.semester}</span></td>
    </tr>`).join('');
}

/* ════════════════════════════════════════════════════
   ADMIN PROFILE
   ════════════════════════════════════════════════════ */
function renderAdminProfile() {
  const u = currentAdmin;
  document.getElementById('profileAvatar').textContent = Fmt.initials(u.name);
  document.getElementById('profileName').textContent   = u.name;
  document.getElementById('profileEmail').textContent  = u.email;
  document.getElementById('profileTags').innerHTML = [u.college || '', 'College Admin']
    .filter(Boolean).map(t => `<span class="profile-tag">${t}</span>`).join('');

  document.getElementById('profileDetailGrid').innerHTML = [
    ['👤 Full Name', u.name], ['📧 Email', u.email],
    ['📱 Contact', u.contact], ['🏫 College', u.college], ['🔐 Role', 'College Admin'],
  ].map(([l, v]) => `<div class="detail-item"><div class="detail-label">${l}</div><div class="detail-value">${v || '—'}</div></div>`).join('');

  Form.setVal('apName',    u.name);
  Form.setVal('apContact', u.contact);
  Form.setVal('apEmail',   u.email);
}

function toggleProfileEdit() {
  const view = document.getElementById('profileViewCard');
  const edit = document.getElementById('profileEditCard');
  const show = view.style.display !== 'none';
  view.style.display = show ? 'none' : 'block';
  edit.style.display = show ? 'block' : 'none';
}

async function saveAdminProfile() {
  let ok = true;
  const checks = [
    ['apName',    Validate.required(Form.getVal('apName'), 'Name')],
    ['apContact', Validate.mobile(Form.getVal('apContact'))],
    ['apEmail',   Validate.email(Form.getVal('apEmail'))],
  ];
  checks.forEach(([id, err]) => { if (err) { Form.showError(id, err); ok = false; } });
  if (!ok) return;

  Form.setLoading('saveAdminProfileBtn', true, '💾 Save Changes');
  try {
    const res = await AdminAPI.updateProfile({
      name:    Form.getVal('apName'),
      contact: Form.getVal('apContact'),
      email:   Form.getVal('apEmail'),
    });
    currentAdmin = { ...currentAdmin, ...res.data };
    Session.save(currentAdmin, Session.getToken(), 'ADMIN');
    toggleProfileEdit();
    renderAdminProfile();
    renderNavbar();
    Toast.success('Profile updated ✅');
  } catch (err) {
    Toast.error(err.message || 'Update failed');
    Form.setLoading('saveAdminProfileBtn', false, '💾 Save Changes');
  }
}

async function changeAdminPw() {
  const current = document.getElementById('apwCurrent').value;
  const newPw   = document.getElementById('apwNew').value;
  const confirm = document.getElementById('apwConfirm').value;

  if (!current || !newPw || !confirm) { showApwAlert('All fields are required', 'error'); return; }
  if (newPw.length < 6)               { showApwAlert('New password must be at least 6 characters', 'error'); return; }
  if (newPw !== confirm)              { showApwAlert('Passwords do not match', 'error'); return; }

  Form.setLoading('adminPwBtn', true, '🔒 Update Password');
  try {
    await AdminAPI.changePassword({ currentPassword: current, newPassword: newPw, confirmPassword: confirm });
    document.getElementById('apwCurrent').value = '';
    document.getElementById('apwNew').value     = '';
    document.getElementById('apwConfirm').value = '';
    showApwAlert('Password changed successfully!', 'success');
    Toast.success('Password changed 🔒');
  } catch (err) {
    showApwAlert(err.message || 'Failed to change password', 'error');
  } finally {
    Form.setLoading('adminPwBtn', false, '🔒 Update Password');
  }
}

function showApwAlert(msg, type) {
  const el = document.getElementById('apwAlert');
  el.className = `alert alert-${type}`;
  el.innerHTML = `<span class="alert-icon">${type === 'error' ? '⚠️' : '✅'}</span><span>${msg}</span>`;
  el.style.display = 'flex';
  setTimeout(() => el.style.display = 'none', 4000);
}

/* ── Logout ─────────────────────────────────────────── */
function doLogout() {
  Session.clear();
  Toast.info('Logged out');
  setTimeout(() => location.href = 'index.html', 500);
}
