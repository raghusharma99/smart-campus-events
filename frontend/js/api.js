/* =====================================================
   Smart Campus Events
   js/api.js  — All API calls to Spring Boot backend
   ===================================================== */

const API_BASE = 'http://localhost:8080/api';

/* ── Token helpers ─────────────────────────────────── */
const getToken  = ()     => localStorage.getItem('sce_token');
const setToken  = (tok)  => localStorage.setItem('sce_token', tok);
const clearToken = ()    => localStorage.removeItem('sce_token');

/* ── Auth headers ──────────────────────────────────── */
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

/* ── Generic fetch wrapper ─────────────────────────── */
async function request(method, path, body = null, auth = true) {
  const opts = {
    method,
    headers: auth
      ? authHeaders()
      : { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return data;
}

/* ══════════════════════════════════════════════════════
   AUTH API
   ══════════════════════════════════════════════════════ */
const AuthAPI = {
  studentRegister: (payload) =>
    request('POST', '/auth/student/register', payload, false),

  studentLogin: (identifier, password) =>
    request('POST', '/auth/student/login', { identifier, password }, false),

  adminLogin: (identifier, password) =>
    request('POST', '/auth/admin/login', { identifier, password }, false),
};

/* ══════════════════════════════════════════════════════
   EVENTS API
   ══════════════════════════════════════════════════════ */
const EventsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/events${qs ? '?' + qs : ''}`, null, false);
  },

  getOne: (id) => request('GET', `/events/${id}`, null, false),

  getMyEvents: ()         => request('GET',    '/events/my-events'),
  create:      (payload)  => request('POST',   '/events', payload),
  update:      (id, data) => request('PUT',    `/events/${id}`, data),
  delete:      (id)       => request('DELETE', `/events/${id}`),
};

/* ══════════════════════════════════════════════════════
   REGISTRATIONS API
   ══════════════════════════════════════════════════════ */
const RegistrationsAPI = {
  register:           (payload) => request('POST', '/registrations', payload),
  getMyRegistrations: ()        => request('GET',  '/registrations/my'),
  getAdminAll:        ()        => request('GET',  '/registrations/admin/all'),
  getByEvent:         (eventId) => request('GET',  `/registrations/event/${eventId}`),
  updateStatus:       (id, status) =>
    request('PUT', `/registrations/${id}/status`, { status }),
};

/* ══════════════════════════════════════════════════════
   STUDENT API
   ══════════════════════════════════════════════════════ */
const StudentAPI = {
  getProfile:     ()       => request('GET', '/student/profile'),
  updateProfile:  (data)   => request('PUT', '/student/profile', data),
  changePassword: (data)   => request('PUT', '/student/change-password', data),
};

/* ══════════════════════════════════════════════════════
   ADMIN API
   ══════════════════════════════════════════════════════ */
const AdminAPI = {
  getProfile:      ()     => request('GET', '/admin/profile'),
  updateProfile:   (data) => request('PUT', '/admin/profile', data),
  changePassword:  (data) => request('PUT', '/admin/change-password', data),
  getAllStudents:   ()     => request('GET', '/admin/all-students'),
  getDashStats:    ()     => request('GET', '/admin/dashboard-stats'),
};

/* ══════════════════════════════════════════════════════
   FEEDBACK API
   ══════════════════════════════════════════════════════ */
const FeedbackAPI = {
  submit:         (payload) => request('POST', '/feedback', payload),
  getMy:          ()        => request('GET',  '/feedback/my'),
  getForEvent:    (eventId) => request('GET',  `/feedback/event/${eventId}`),
};

/* ══════════════════════════════════════════════════════
   RAZORPAY PAYMENT API
   ══════════════════════════════════════════════════════ */
const PaymentAPI = {
  // Step 1: Create Razorpay order on backend
  createOrder: (eventId) =>
    request('POST', '/payments/create-order', { eventId }),

  // Step 2: Verify payment signature on backend
  verifyPayment: (razorpayOrderId, razorpayPaymentId, razorpaySignature, eventId) =>
    request('POST', '/payments/verify', {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      eventId
    }),

  // Register for free events (no payment)
  registerFree: (eventId) =>
    request('POST', '/payments/register-free', { eventId }),

  // Get payment history
  getMyPayments: () => request('GET', '/payments/my-payments'),
};
