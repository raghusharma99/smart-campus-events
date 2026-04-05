/* =====================================================
   Smart Campus Events
   js/student.js  — Student Dashboard Logic
   ===================================================== */

/* ──  Must be logged in as STUDENT ────────────── */
if (!Session.isLoggedIn() || Session.getRole() !== 'STUDENT') {
  location.href = 'student-login.html';
}

/* ── State ─────────────────────────────────────────── */
let currentUser    = Session.getUser();
let allEvents      = [];
let myRegistrations = [];
let myFeedback     = [];
let activeCat      = 'ALL';
let currentEventForPay  = null;
let currentEventForFeed = null;
let selectedRating = 0;
const CATS = ['ALL', 'SPORTS', 'HACKATHON', 'CULTURAL', 'WORKSHOP', 'SEMINAR', 'QUIZ'];

/* ── Init ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar();
  await loadAll();
  renderHome();
  buildCatFilters();
});

/* ── Load all data ─────────────────────────────────── */
async function loadAll() {
  try {
    const [evRes, regRes, fbRes] = await Promise.all([
      EventsAPI.getAll(),
      RegistrationsAPI.getMyRegistrations(),
      FeedbackAPI.getMy(),
    ]);
    allEvents       = evRes.data       || [];
    myRegistrations = regRes.data      || [];
    myFeedback      = fbRes.data       || [];
    updateRegBadge();
  } catch (err) {
    Toast.error('Failed to load data: ' + err.message);
  }
}

/* ── Navbar ─────────────────────────────────────────── */
function renderNavbar() {
  document.getElementById('navUserName').textContent = currentUser.name;
  document.getElementById('navAvatar').textContent   = Fmt.initials(currentUser.name);
}

function updateRegBadge() {
  const pending = myRegistrations.filter(r => r.status === 'PENDING').length;
  const badge   = document.getElementById('regBadge');
  if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-flex'; }
  else badge.style.display = 'none';
}

/* ── Page navigation ───────────────────────────────── */
const PAGES = ['home','events','myregs','feedback','profile'];
function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p).style.display = p === name ? 'block' : 'none';
    document.getElementById('nav-' + p)?.classList.toggle('active', p === name);
  });

  if (name === 'events')   renderAllEvents();
  if (name === 'myregs')   renderMyRegs();
  if (name === 'feedback') renderFeedback();
  if (name === 'profile')  renderProfile();

  window.scrollTo(0, 0);
}

/* ════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════ */
function renderHome() {
  const u = currentUser;
  document.getElementById('wName').textContent = `Welcome back, ${u.name.split(' ')[0]}!`;
  document.getElementById('wInfo').textContent = `${u.course || ''} — ${u.branch || ''} | Sem ${u.semester || ''} | ${u.college || ''}`;

  document.getElementById('wConfirmed').textContent = myRegistrations.filter(r => r.status === 'APPROVED').length;
  document.getElementById('wPending').textContent   = myRegistrations.filter(r => r.status === 'PENDING').length;
  document.getElementById('wUpcoming').textContent  = allEvents.filter(e => new Date(e.startDate) > new Date()).length;

  const grid = document.getElementById('homeEventGrid');
  const trending = allEvents.filter(e => e.status === 'ACTIVE').slice(0, 3);
  grid.innerHTML = trending.length ? trending.map(e => eventCardHTML(e)).join('') : emptyState('📅', 'No events yet');
  attachEventCardClicks('homeEventGrid');
}

/* ════════════════════════════════════════════════════
   BROWSE EVENTS
   ════════════════════════════════════════════════════ */
function buildCatFilters() {
  const container = document.getElementById('catFilters');
  container.innerHTML = CATS.map(c =>
    `<button class="btn btn-sm ${c === 'ALL' ? 'btn-primary' : 'btn-secondary'}" data-cat="${c}" onclick="setCat('${c}',this)">
       ${c === 'ALL' ? '🌐 All' : (EventHelper.CAT_EMOJIS[c] || '') + ' ' + c.charAt(0) + c.slice(1).toLowerCase()}
     </button>`
  ).join('');
}

function setCat(cat, btn) {
  activeCat = cat;
  document.querySelectorAll('#catFilters .btn').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
  btn.classList.add('btn-primary'); btn.classList.remove('btn-secondary');
  filterEvents();
}

function filterEvents() {
  const kw = document.getElementById('evSearch').value.toLowerCase();
  let filtered = allEvents.filter(e => e.status === 'ACTIVE');
  if (activeCat !== 'ALL') filtered = filtered.filter(e => e.category === activeCat);
  if (kw) filtered = filtered.filter(e => e.title.toLowerCase().includes(kw) || (e.college||'').toLowerCase().includes(kw));

  const grid = document.getElementById('allEventGrid');
  grid.innerHTML = filtered.length ? filtered.map(e => eventCardHTML(e)).join('') : emptyState('📭', 'No events found', 'Try a different search or category');
  attachEventCardClicks('allEventGrid');
}

function renderAllEvents() {
  filterEvents();
}

/* ── Event Card HTML ─────────────────────────────────── */
function eventCardHTML(e) {
  const color    = EventHelper.CAT_COLORS[e.category] || '#64748b';
  const emoji    = EventHelper.CAT_EMOJIS[e.category] || '📌';
  const isFree   = EventHelper.isFree(e);
  const left     = EventHelper.slotsLeft(e);
  const pct      = EventHelper.slotsPercent(e);
  const reg      = myRegistrations.find(r => r.eventId === e.id);
  const danger   = left < 10;

  return `
    <div class="event-card" data-event-id="${e.id}">
      <div class="event-banner" style="background:linear-gradient(135deg,${color}22,${color}44);">
        <span>${emoji}</span>
        <span style="position:absolute;top:10px;right:10px;" class="badge" style="background:${color}22;color:${color};">${e.category}</span>
        <span style="position:absolute;top:10px;left:10px;" class="badge ${isFree ? 'badge-green' : 'badge-gold'}">${isFree ? '🆓 FREE' : '₹' + e.fee}</span>
      </div>
      <div class="event-body">
        <div class="event-category" style="color:${color};">${e.category}</div>
        <div class="event-title">${e.title}</div>
        <div class="event-meta">
          <div class="event-meta-row">📅 ${Fmt.date(e.startDate)} — ${Fmt.date(e.endDate)}</div>
          <div class="event-meta-row">📍 ${e.location}</div>
          <div class="event-meta-row">🏫 ${e.college}</div>
        </div>
        <div style="margin-bottom:12px;">
          <div class="flex-between" style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;">
            <span>${e.filledSlots}/${e.totalSlots} registered</span>
            <span style="color:${danger ? 'var(--red)' : 'var(--text-muted)'};">${left} slots left</span>
          </div>
          <div class="progress"><div class="progress-bar ${danger ? 'danger' : ''}" style="width:${pct}%;"></div></div>
        </div>
        <div class="event-footer">
          ${reg
            ? `<span class="badge ${reg.status === 'APPROVED' ? 'badge-green' : reg.status === 'REJECTED' ? 'badge-red' : 'badge-gold'}">${reg.status === 'APPROVED' ? '✅ Registered' : reg.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending'}</span>`
            : `<button class="btn btn-primary btn-sm register-btn" data-event-id="${e.id}">Register →</button>`
          }
          <button class="btn btn-sm btn-secondary view-btn" data-event-id="${e.id}">View</button>
        </div>
      </div>
    </div>`;
}

function attachEventCardClicks(gridId) {
  document.getElementById(gridId).querySelectorAll('[data-event-id]').forEach(card => {
    const eId = parseInt(card.dataset.eventId);
    card.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (ev) => { ev.stopPropagation(); openEventDetail(eId); }));
    card.querySelectorAll('.register-btn').forEach(btn => btn.addEventListener('click', (ev) => { ev.stopPropagation(); openPayModal(eId); }));
    card.addEventListener('click', () => openEventDetail(eId));
  });
}

/* ════════════════════════════════════════════════════
   EVENT DETAIL MODAL
   ════════════════════════════════════════════════════ */
function openEventDetail(eventId) {
  const e     = allEvents.find(ev => ev.id === eventId);
  if (!e) return;
  const color = EventHelper.CAT_COLORS[e.category] || '#64748b';
  const emoji = EventHelper.CAT_EMOJIS[e.category] || '📌';
  const reg   = myRegistrations.find(r => r.eventId === e.id);
  const left  = EventHelper.slotsLeft(e);

  document.getElementById('eventDetailBanner').style.background = `linear-gradient(135deg,${color}33,${color}55)`;
  document.getElementById('eventDetailBanner').querySelector('span:first-child') && null;
  document.getElementById('eventDetailBanner').innerHTML = `
    ${emoji}
    <button class="modal-close" style="position:absolute;top:14px;right:14px;" onclick="Modal.close('eventDetailModal')">✕</button>
    <span class="badge" style="position:absolute;top:14px;left:14px;background:${color}44;color:${color};">${e.category}</span>
  `;

  document.getElementById('eventDetailBody').innerHTML = `
    <div class="flex-between" style="gap:12px;flex-wrap:wrap;margin-bottom:14px;">
      <h2 style="font-size:1.25rem;font-weight:800;">${e.title}</h2>
      <span class="badge ${EventHelper.isFree(e) ? 'badge-green' : 'badge-gold'}" style="font-size:0.95rem;padding:5px 14px;">
        ${EventHelper.isFree(e) ? '🆓 FREE' : '₹' + e.fee}
      </span>
    </div>
    <p style="color:var(--text-muted);line-height:1.7;margin-bottom:18px;">${e.description}</p>
    <div class="detail-grid" style="margin-bottom:16px;">
      <div class="detail-item"><div class="detail-label">📅 Start Date</div><div class="detail-value">${Fmt.date(e.startDate)}</div></div>
      <div class="detail-item"><div class="detail-label">📅 End Date</div><div class="detail-value">${Fmt.date(e.endDate)}</div></div>
      <div class="detail-item"><div class="detail-label">📍 Venue</div><div class="detail-value">${e.location}</div></div>
      <div class="detail-item"><div class="detail-label">🏫 Organizer</div><div class="detail-value">${e.college}</div></div>
    </div>
    <div style="margin-bottom:6px;">
      <div class="flex-between" style="font-size:0.8rem;color:var(--text-muted);margin-bottom:5px;">
        <span>Capacity: ${e.filledSlots}/${e.totalSlots}</span>
        <span>${EventHelper.slotsLeft(e)} slots available</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${EventHelper.slotsPercent(e)}%;"></div></div>
    </div>
  `;

  document.getElementById('eventDetailFooter').innerHTML = `
    <button class="btn btn-secondary" onclick="Modal.close('eventDetailModal')">Close</button>
    ${!reg && left > 0
      ? `<button class="btn btn-primary" onclick="Modal.close('eventDetailModal');openPayModal(${e.id})">
           ${EventHelper.isFree(e) ? '🎟️ Register Now' : `💳 Register & Pay ₹${e.fee}`}
         </button>`
      : reg
        ? `<span class="badge badge-green" style="padding:8px 16px;font-size:0.875rem;">✅ Already Registered (${reg.status})</span>`
        : `<span class="badge badge-red" style="padding:8px 16px;font-size:0.875rem;">❌ Slots Full</span>`
    }
  `;
  Modal.open('eventDetailModal');
}

/* ════════════════════════════════════════════════════
   RAZORPAY PAYMENT — Full Integration
   Flow: openPayModal → createOrder → Razorpay popup
         → onSuccess → verifyPayment → saveRegistration
   ════════════════════════════════════════════════════ */

async function openPayModal(eventId) {
  const e = allEvents.find(ev => ev.id === eventId);
  if (!e) return;
  currentEventForPay = e;

  // FREE event — no payment needed
  if (EventHelper.isFree(e)) {
    renderFreeConfirm(e);
    Modal.open('payModal');
    return;
  }

  // PAID event — show Razorpay summary screen
  renderRazorpaySummary(e);
  Modal.open('payModal');
}

/* ── Show summary before Razorpay popup ─────────────── */
function renderRazorpaySummary(e) {
  document.getElementById('payModalTitle').textContent = '💳 Payment via Razorpay';
  document.getElementById('payModalBody').innerHTML = `
    <!-- Event Summary -->
    <div style="background:var(--gray-50);border-radius:var(--radius);padding:14px 16px;margin-bottom:18px;">
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:4px;">${e.title}</div>
      <div style="font-size:0.78rem;color:var(--text-muted);">${Fmt.date(e.startDate)} • ${e.college}</div>
    </div>

    <!-- Razorpay branding + info -->
    <div style="border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:18px;text-align:center;">
      <img src="https://razorpay.com/assets/razorpay-glyph.svg" onerror="this.style.display='none'" style="height:32px;margin-bottom:10px;"/>
      <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:14px;">
        Secure payment powered by <strong>Razorpay</strong><br/>
        Supports UPI · Cards · Net Banking · Wallets
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--border);font-size:0.875rem;">
        <span style="color:var(--text-muted);">Amount</span>
        <span style="font-weight:800;font-size:1.1rem;color:var(--blue);">₹${e.fee}</span>
      </div>
    </div>

    <!-- Supported methods display -->
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:18px;flex-wrap:wrap;">
      <span style="font-size:0.75rem;padding:4px 10px;background:var(--gray-100);border-radius:6px;color:var(--gray-600);">💳 Credit/Debit Card</span>
      <span style="font-size:0.75rem;padding:4px 10px;background:var(--gray-100);border-radius:6px;color:var(--gray-600);">📱 UPI</span>
      <span style="font-size:0.75rem;padding:4px 10px;background:var(--gray-100);border-radius:6px;color:var(--gray-600);">🏦 Net Banking</span>
      <span style="font-size:0.75rem;padding:4px 10px;background:var(--gray-100);border-radius:6px;color:var(--gray-600);">👛 Wallets</span>
    </div>

    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary" onclick="Modal.close('payModal')">Cancel</button>
      <button id="payNowBtn" class="btn btn-primary" style="flex:1;background:linear-gradient(135deg,#2563eb,#06b6d4);" onclick="startRazorpayPayment()">
        🔒 Pay ₹${e.fee} Securely
      </button>
    </div>
  `;
}

/* ── Show free event confirmation ───────────────────── */
function renderFreeConfirm(e) {
  document.getElementById('payModalTitle').textContent = '🎟️ Confirm Registration';
  document.getElementById('payModalBody').innerHTML = `
    <div style="text-align:center;padding:16px 0 20px;">
      <div style="font-size:3rem;margin-bottom:10px;">🎉</div>
      <h3 style="margin-bottom:6px;">Free Event!</h3>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:20px;">No payment needed. Register instantly.</p>
    </div>
    <div style="background:var(--gray-50);border-radius:var(--radius);padding:14px;margin-bottom:18px;">
      ${[['Event', e.title],['Date', Fmt.date(e.startDate)],['Venue', e.location],['Fee', 'FREE']].map(([l,v]) =>
        `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.875rem;"><span style="color:var(--text-muted);">${l}</span><span style="font-weight:600;">${v}</span></div>`
      ).join('')}
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-secondary" onclick="Modal.close('payModal')">Cancel</button>
      <button id="freeRegBtn" class="btn btn-success" style="flex:1;" onclick="confirmFreeRegistration()">
        🎟️ Confirm Registration
      </button>
    </div>
  `;
}

/* ── STEP 1: Create Razorpay order & open popup ─────── */
async function startRazorpayPayment() {
  const e = currentEventForPay;
  const btn = document.getElementById('payNowBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Opening...'; }

  try {
    // Call backend to create Razorpay order
    const res = await PaymentAPI.createOrder(e.id);
    const order = res.data;

    // Razorpay checkout options
    const options = {
      key:         order.keyId,           // Your Razorpay Key ID from backend
      amount:      order.amount,          // in paise (100 = ₹1)
      currency:    order.currency || 'INR',
      name:        'Smart Campus Events',
      description: e.title,
      order_id:    order.orderId,         // Razorpay order ID from backend
      image:       '',                    // optional logo URL

      // ── Called when payment succeeds ──────────────
      handler: async function(response) {
        Modal.close('payModal');
        await verifyAndSavePayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          e.id
        );
      },

      // ── Pre-fill student details ───────────────────
      prefill: {
        name:    currentUser.name,
        email:   currentUser.email,
        contact: currentUser.mobile || '',
      },

      // ── Styling ────────────────────────────────────
      theme: { color: '#2563eb' },

      // ── Called when student closes popup ───────────
      modal: {
        ondismiss: function() {
          Toast.warning('Payment cancelled. You can try again anytime.');
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `🔒 Pay ₹${e.fee} Securely`;
          }
        }
      }
    };

    // Open Razorpay checkout popup
    const rzp = new Razorpay(options);

    // Handle payment failure inside popup
    rzp.on('payment.failed', function(response) {
      Toast.error('Payment failed: ' + (response.error.description || 'Unknown error'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `🔒 Pay ₹${e.fee} Securely`;
      }
    });

    rzp.open();

  } catch (err) {
    Toast.error('Could not initiate payment: ' + (err.message || 'Please try again'));
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `🔒 Pay ₹${e.fee} Securely`;
    }
  }
}

/* ── STEP 2: Verify signature & save registration ────── */
async function verifyAndSavePayment(orderId, paymentId, signature, eventId) {
  // Show verifying toast
  Toast.info('Verifying payment... please wait');

  try {
    const res = await PaymentAPI.verifyPayment(orderId, paymentId, signature, eventId);

    // Payment verified and registration saved
    await loadAll();
    renderHome();
    Toast.success(`Payment of ₹${currentEventForPay?.fee} successful! Registration pending admin approval. 🎉`);
    showPage('myregs');

  } catch (err) {
    Toast.error('Payment verification failed: ' + (err.message || 'Contact support'));
  }
}

/* ── FREE event registration ─────────────────────────── */
async function confirmFreeRegistration() {
  const e = currentEventForPay;
  const btn = document.getElementById('freeRegBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Registering...'; }

  try {
    await PaymentAPI.registerFree(e.id);
    Modal.close('payModal');
    await loadAll();
    renderHome();
    Toast.success('Registered successfully! Awaiting admin approval. 🎉');
    showPage('myregs');
  } catch (err) {
    Toast.error(err.message || 'Registration failed. Please try again.');
    if (btn) { btn.disabled = false; btn.innerHTML = '🎟️ Confirm Registration'; }
  }
}

/* ── Old confirmRegistration kept for compatibility ───── */
async function confirmRegistration() {
  const e = currentEventForPay;
  Form.setLoading('confirmPayBtn', true, '');

  try {
    await PaymentAPI.registerFree(e.id);
    Modal.close('payModal');
    await loadAll();
    renderHome();
    Toast.success('Registered! Awaiting admin approval. 🎉');
    showPage('myregs');
  } catch (err) {
    Toast.error(err.message || 'Registration failed');
    Form.setLoading('confirmPayBtn', false, '🎟️ Confirm Registration');
  }
}

/* DUMMY — kept so old references don't break */
function renderPayStep(){}
function selectPayMethod(){}
function goPayConfirm(){}

async function _OLD_confirmRegistration_UNUSED() {
  const e = currentEventForPay;
  Form.setLoading('confirmPayBtn', true, '');

  try {
    await RegistrationsAPI.register({
      eventId: e.id,
      paymentMethod: EventHelper.isFree(e) ? 'FREE' : 'CARD',
    });
    Modal.close('payModal');
    await loadAll();
    renderHome();
    Toast.success(EventHelper.isFree(e) ? 'Registered! Awaiting admin approval. 🎉' : `Payment of ₹${e.fee} successful! Awaiting approval. 💳`);
    showPage('myregs');
  } catch (err) {
    Toast.error(err.message || 'Registration failed');
    Form.setLoading('confirmPayBtn', false, EventHelper.isFree(e) ? '🎟️ Confirm Registration' : `💳 Pay ₹${e.fee}`);
  }
}

/* ════════════════════════════════════════════════════
   MY REGISTRATIONS
   ════════════════════════════════════════════════════ */
let regFilter = 'ALL';
function filterRegs(status, btn) {
  regFilter = status;
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderMyRegs();
}

function renderMyRegs() {
  const list = myRegistrations.filter(r => regFilter === 'ALL' || r.status === regFilter);
  const el   = document.getElementById('regList');

  if (!list.length) { el.innerHTML = emptyState('🎟️', 'No registrations', 'Register for events to see them here.'); return; }

  const eventsMap = Object.fromEntries(allEvents.map(e => [e.id, e]));
  el.innerHTML = `<div class="card">` + list.map(r => {
    const ev      = eventsMap[r.eventId] || {};
    const color   = EventHelper.CAT_COLORS[ev.category] || '#64748b';
    const emoji   = EventHelper.CAT_EMOJIS[ev.category] || '📌';
    const isPast  = ev.endDate && new Date(ev.endDate) < new Date();
    const hasFb   = myFeedback.find(f => f.eventId === r.eventId);

    return `<div class="reg-item">
      <div class="reg-item-left">
        <div class="reg-item-icon" style="background:${color}20;">${emoji}</div>
        <div>
          <div class="reg-item-title">${ev.title || 'Event'}</div>
          <div class="reg-item-sub">${Fmt.date(ev.startDate)} • ${ev.college || ''}</div>
          <div class="reg-item-badges">
            ${EventHelper.statusBadge(r.status)}
            ${EventHelper.payBadge(r.paymentStatus, r.amountPaid)}
            ${r.transactionId ? `<span class="badge badge-gray" title="Transaction ID" style="font-family:monospace;font-size:0.68rem;">${r.transactionId}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="reg-item-actions">
        ${isPast && r.status === 'APPROVED' && !hasFb
          ? `<button class="btn btn-gold btn-sm" onclick="openFeedbackModal(${r.eventId})">⭐ Review</button>`
          : hasFb ? `<span class="badge badge-gold">⭐ Reviewed</span>` : ''
        }
      </div>
    </div>`;
  }).join('') + `</div>`;
}

/* ════════════════════════════════════════════════════
   FEEDBACK
   ════════════════════════════════════════════════════ */
function renderFeedback() {
  const el = document.getElementById('feedbackList');
  if (!myFeedback.length) { el.innerHTML = emptyState('⭐', 'No feedback given', 'Attend events and leave reviews!'); return; }
  el.innerHTML = `<div class="card">${myFeedback.map(f => `
    <div class="feedback-item">
      <div class="feedback-item-header">
        <div class="feedback-item-title">${f.eventTitle || 'Event'}</div>
        ${renderStars(f.rating)}
      </div>
      ${f.comment ? `<div class="feedback-comment">${f.comment}</div>` : ''}
      <div class="feedback-meta">${Fmt.dateTime(f.createdAt)}</div>
    </div>`).join('')}</div>`;
}

/* ── Feedback Modal ─────────────────────────────────── */
function openFeedbackModal(eventId) {
  const ev = allEvents.find(e => e.id === eventId);
  currentEventForFeed = ev;
  selectedRating = 0;
  document.getElementById('fbEventTitle').textContent = ev?.title || 'Event';
  document.getElementById('fbComment').value = '';
  document.getElementById('fbRatingLabel').textContent = '';
  buildFbStars(0);
  Modal.open('feedbackModal');
}

function buildFbStars(current) {
  const container = document.getElementById('fbStars');
  container.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement('span');
    span.className = `star ${i <= current ? 'active' : ''}`;
    span.textContent = '★';
    span.dataset.val = i;
    span.addEventListener('mouseover', () => buildFbStars(i));
    span.addEventListener('mouseleave', () => buildFbStars(selectedRating));
    span.addEventListener('click', () => { selectedRating = i; buildFbStars(i); document.getElementById('fbRatingLabel').textContent = ['','Poor','Below Average','Average','Good','Excellent!'][i]; });
    container.appendChild(span);
  }
}

async function submitFeedback() {
  if (!selectedRating) { Toast.warning('Please select a star rating'); return; }
  Form.setLoading('fbSubmitBtn', true, '');
  try {
    await FeedbackAPI.submit({ eventId: currentEventForFeed.id, rating: selectedRating, comment: document.getElementById('fbComment').value });
    Modal.close('feedbackModal');
    await loadAll();
    renderFeedback();
    Toast.success('Feedback submitted! Thank you ⭐');
  } catch (err) {
    Toast.error(err.message || 'Failed to submit feedback');
    Form.setLoading('fbSubmitBtn', false, '⭐ Submit Feedback');
  }
}

/* ════════════════════════════════════════════════════
   PROFILE
   ════════════════════════════════════════════════════ */
function renderProfile() {
  const u = currentUser;
  document.getElementById('profileAvatar').textContent = Fmt.initials(u.name);
  document.getElementById('profileName').textContent   = u.name;
  document.getElementById('profileEmail').textContent  = u.email;
  document.getElementById('profileTags').innerHTML = [u.course, u.branch, `Sem ${u.semester}`, u.college]
    .filter(Boolean).map(t => `<span class="profile-tag">${t}</span>`).join('');

  document.getElementById('profileDetailGrid').innerHTML = [
    ['👤 Full Name', u.name], ['📧 Email', u.email], ['📱 Mobile', u.mobile],
    ['🔖 Enrollment No.', u.enrollmentNo], ['📋 Roll Number', u.rollNo],
    ['📚 Course', u.course], ['🏛️ Branch', u.branch],
    ['📅 Semester', u.semester], ['📆 Year', `Year ${u.year}`],
    ['🏫 College', u.college],
  ].map(([l, v]) => `<div class="detail-item"><div class="detail-label">${l}</div><div class="detail-value">${v || '—'}</div></div>`).join('');

  // Populate edit form
  Form.setVal('pName',     u.name);
  Form.setVal('pMobile',   u.mobile);
  Form.setVal('pEmail',    u.email);
  Form.setVal('pCollege',  u.college);
  Form.setVal('pEnroll',   u.enrollmentNo);
  Form.setVal('pRoll',     u.rollNo);
  document.getElementById('pCourse').value   = u.course   || 'B.Tech';
  document.getElementById('pBranch').value   = u.branch   || 'Computer Science';
  document.getElementById('pSemester').value = u.semester || 5;
}

function toggleProfileEdit() {
  const view = document.getElementById('profileViewCard');
  const edit = document.getElementById('profileEditCard');
  const isView = view.style.display !== 'none';
  view.style.display = isView ? 'none'  : 'block';
  edit.style.display = isView ? 'block' : 'none';
}

async function saveProfile() {
  let ok = true;
  const checks = [
    ['pName',   Validate.required(Form.getVal('pName'), 'Name')],
    ['pMobile', Validate.mobile(Form.getVal('pMobile'))],
    ['pEmail',  Validate.email(Form.getVal('pEmail'))],
  ];
  checks.forEach(([id, err]) => { if (err) { Form.showError(id, err); ok = false; } });
  if (!ok) return;

  Form.setLoading('saveProfileBtn', true, '💾 Save Changes');
  try {
    const res = await StudentAPI.updateProfile({
      name:         Form.getVal('pName'),
      mobile:       Form.getVal('pMobile'),
      email:        Form.getVal('pEmail'),
      college:      Form.getVal('pCollege'),
      enrollmentNo: Form.getVal('pEnroll'),
      rollNo:       Form.getVal('pRoll'),
      course:       document.getElementById('pCourse').value,
      branch:       document.getElementById('pBranch').value,
      semester:     parseInt(document.getElementById('pSemester').value),
      year:         currentUser.year,
    });
    currentUser = { ...currentUser, ...res.data };
    Session.save(currentUser, Session.getToken(), 'STUDENT');
    toggleProfileEdit();
    renderProfile();
    renderNavbar();
    Toast.success('Profile updated successfully ✅');
  } catch (err) {
    Toast.error(err.message || 'Update failed');
  } finally {
    Form.setLoading('saveProfileBtn', false, '💾 Save Changes');
  }
}

async function changePassword() {
  const current = document.getElementById('cpCurrent').value;
  const newPw   = document.getElementById('cpNew').value;
  const confirm = document.getElementById('cpConfirm').value;

  if (!current || !newPw || !confirm) { showPwAlert('All fields are required', 'error'); return; }
  if (newPw.length < 6)               { showPwAlert('New password must be at least 6 characters', 'error'); return; }
  if (newPw !== confirm)              { showPwAlert('Passwords do not match', 'error'); return; }

  Form.setLoading('changePwBtn', true, '🔒 Update Password');
  try {
    await StudentAPI.changePassword({ currentPassword: current, newPassword: newPw, confirmPassword: confirm });
    document.getElementById('cpCurrent').value = '';
    document.getElementById('cpNew').value     = '';
    document.getElementById('cpConfirm').value = '';
    showPwAlert('Password changed successfully!', 'success');
    Toast.success('Password changed 🔒');
  } catch (err) {
    showPwAlert(err.message || 'Failed to change password', 'error');
  } finally {
    Form.setLoading('changePwBtn', false, '🔒 Update Password');
  }
}

function showPwAlert(msg, type) {
  const el = document.getElementById('pwAlert');
  el.className = `alert alert-${type}`;
  el.innerHTML = `<span class="alert-icon">${type==='error'?'⚠️':'✅'}</span><span>${msg}</span>`;
  el.style.display = 'flex';
  setTimeout(() => el.style.display = 'none', 4000);
}

/* ── Logout ─────────────────────────────────────────── */
function doLogout() {
  Session.clear();
  Toast.info('Logged out successfully');
  setTimeout(() => location.href = 'index.html', 500);
}

/* ── Empty state helper ─────────────────────────────── */
function emptyState(icon, title, text = '') {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div>${text ? `<div class="empty-state-text">${text}</div>` : ''}</div>`;
}
