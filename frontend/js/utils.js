/* =====================================================
   Smart Campus Events
   js/utils.js  — Shared helper utilities
   ===================================================== */

/* ── Session storage helpers ───────────────────────── */
const Session = {
  save(user, token, role) {
    localStorage.setItem('sce_token', token);
    localStorage.setItem('sce_user',  JSON.stringify(user));
    localStorage.setItem('sce_role',  role);
  },
  getUser()  { try { return JSON.parse(localStorage.getItem('sce_user')); } catch { return null; } },
  getRole()  { return localStorage.getItem('sce_role'); },
  getToken() { return localStorage.getItem('sce_token'); },
  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
  clear() {
    ['sce_token','sce_user','sce_role'].forEach(k => localStorage.removeItem(k));
  }
};

/* ── Toast Notifications ───────────────────────────── */
const Toast = {
  _container: null,

  init() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.id = 'toast-container';
      document.body.appendChild(this._container);
    }
  },

  show(message, type = 'success', duration = 3500) {
    this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    this._container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error', 4500),
  info:    (msg) => Toast.show(msg, 'info'),
  warning: (msg) => Toast.show(msg, 'warning'),
};

/* ── Modal helpers ─────────────────────────────────── */
const Modal = {
  open(id)  { const m = document.getElementById(id); if (m) { m.style.display = 'flex'; document.body.style.overflow = 'hidden'; } },
  close(id) { const m = document.getElementById(id); if (m) { m.style.display = 'none';  document.body.style.overflow = ''; } },
  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    document.body.style.overflow = '';
  }
};

/* ── Date formatters ───────────────────────────────── */
const Fmt = {
  date(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  dateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  },
  currency(n) { return `₹${Number(n || 0).toLocaleString('en-IN')}`; },
  initials(name) {
    if (!name) return '??';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
};

/* ── Input validators ──────────────────────────────── */
const Validate = {
  required(val, label) {
    if (!val || !String(val).trim()) return `${label} is required`;
    return null;
  },
  email(val) {
    if (!val) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return null;
  },
  mobile(val) {
    if (!val) return 'Mobile number is required';
    if (!/^[0-9]{10}$/.test(val)) return 'Enter a valid 10-digit mobile number';
    return null;
  },
  password(val) {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return null;
  },
  confirmPassword(pass, confirm) {
    if (!confirm) return 'Please confirm your password';
    if (pass !== confirm) return 'Passwords do not match';
    return null;
  },
  cardNumber(val) {
    const clean = val.replace(/\s/g, '');
    if (!clean) return 'Card number is required';
    if (!/^\d{16}$/.test(clean)) return 'Enter a valid 16-digit card number';
    return null;
  },
  cardExpiry(val) {
    if (!val) return 'Expiry date is required';
    if (!/^\d{2}\/\d{2}$/.test(val)) return 'Enter expiry as MM/YY';
    const [mm, yy] = val.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'Invalid month';
    const now = new Date(); const nowYY = now.getFullYear() % 100; const nowMM = now.getMonth() + 1;
    if (yy < nowYY || (yy === nowYY && mm < nowMM)) return 'Card has expired';
    return null;
  },
  cvv(val) {
    if (!val) return 'CVV is required';
    if (!/^\d{3}$/.test(val)) return 'CVV must be 3 digits';
    return null;
  },
  upiId(val) {
    if (!val) return 'UPI ID is required';
    if (!/^[\w.\-]+@[\w]+$/.test(val)) return 'Enter a valid UPI ID (e.g. name@upi)';
    return null;
  }
};

/* ── Form helpers ──────────────────────────────────── */
const Form = {
  showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(fieldId + '-err');
    if (field) field.classList.add('error');
    if (errEl) { errEl.textContent = message; errEl.style.display = 'flex'; }
  },
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    const errEl = document.getElementById(fieldId + '-err');
    if (field) field.classList.remove('error');
    if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
  },
  clearAll(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  },
  getVal(id)    { const el = document.getElementById(id); return el ? el.value.trim() : ''; },
  setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v; },
  setLoading(btnId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="spinner"></span> Please wait...`
      : defaultText;
  }
};

/* ── Event data helpers ────────────────────────────── */
const EventHelper = {
  CAT_COLORS: {
    SPORTS: '#10b981', HACKATHON: '#2563eb', CULTURAL: '#f59e0b',
    WORKSHOP: '#8b5cf6', SEMINAR: '#06b6d4', QUIZ: '#ef4444'
  },
  CAT_EMOJIS: {
    SPORTS: '⚽', HACKATHON: '💻', CULTURAL: '🎭',
    WORKSHOP: '🔧', SEMINAR: '📚', QUIZ: '🧠'
  },
  isFree:    (e) => Number(e.fee) === 0,
  slotsLeft: (e) => (e.totalSlots || 0) - (e.filledSlots || 0),
  slotsPercent: (e) => Math.min(100, Math.round(((e.filledSlots || 0) / (e.totalSlots || 1)) * 100)),
  statusBadge(status) {
    const map = {
      PENDING:  { class: 'badge-gold',   icon: '⏳', label: 'Pending'  },
      APPROVED: { class: 'badge-green',  icon: '✅', label: 'Approved' },
      REJECTED: { class: 'badge-red',    icon: '❌', label: 'Rejected' },
      ACTIVE:   { class: 'badge-green',  icon: '🟢', label: 'Active'   },
      DRAFT:    { class: 'badge-gray',   icon: '📝', label: 'Draft'    },
      CANCELLED:{ class: 'badge-red',    icon: '🚫', label: 'Cancelled'},
      COMPLETED:{ class: 'badge-blue',   icon: '✅', label: 'Completed'},
    };
    const s = map[status] || { class: 'badge-gray', icon: '•', label: status };
    return `<span class="badge ${s.class}">${s.icon} ${s.label}</span>`;
  },
  payBadge(status, amount) {
    if (status === 'FREE')  return `<span class="badge badge-green">🆓 Free</span>`;
    if (status === 'PAID')  return `<span class="badge badge-blue">💳 ${Fmt.currency(amount)}</span>`;
    if (status === 'PENDING') return `<span class="badge badge-gold">⏳ Pending Payment</span>`;
    return `<span class="badge badge-gray">${status}</span>`;
  }
};

/* ── Stars HTML ────────────────────────────────────── */
function renderStars(rating, readOnly = true) {
  let html = '<div class="star-group">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rating ? 'active' : ''} ${readOnly ? 'read-only' : ''}" data-val="${i}">★</span>`;
  }
  html += '</div>';
  return html;
}

/* ── Format card number input ──────────────────────── */
function formatCardInput(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiryInput(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  e.target.value = v;
}

/* ── Generate transaction ID ───────────────────────── */
function genTxnId() {
  return 'TXN_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
}
