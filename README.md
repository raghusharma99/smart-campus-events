# 🎓 Smart Campus Events Platform
### Full-Stack: HTML + CSS + JavaScript + Spring Boot + MySQL + Razorpay

---

## 📁 Project Structure

```
smart-campus-events/
│
├── database/
│   ├── schema.sql              ← Original schema
│   └── RESET_DATABASE.sql      ← ✅ USE THIS — drops & recreates all tables cleanly
│
├── frontend/
│   ├── assets/favicon.svg
│   ├── css/
│   │   ├── style.css           ← Global styles
│   │   ├── auth.css            ← Login/Register styles
│   │   └── dashboard.css       ← Sidebar, Navbar
│   ├── js/
│   │   ├── api.js              ← All API calls + PaymentAPI (Razorpay)
│   │   ├── utils.js            ← Toast, Session, Validate helpers
│   │   ├── student.js          ← Student dashboard + Razorpay payment flow
│   │   └── admin.js            ← Admin dashboard logic
│   └── pages/
│       ├── index.html          ← Landing page
│       ├── student-login.html  ← Student login + 2-step register
│       ├── admin-login.html    ← Admin login
│       ├── student-dashboard.html  ← Student portal (with Razorpay SDK)
│       └── admin-dashboard.html    ← Admin portal
│
└── backend/
    ├── pom.xml                 ← Maven + Spring Boot + Razorpay dependency
    └── src/main/
        ├── java/com/smartcampus/
        │   ├── SmartCampusEventsApplication.java
        │   ├── config/
        │   │   ├── JwtAuthFilter.java
        │   │   ├── JwtUtils.java
        │   │   └── SecurityConfig.java
        │   ├── controller/
        │   │   ├── AuthController.java
        │   │   ├── EventController.java
        │   │   ├── RegistrationController.java
        │   │   ├── PaymentController.java    ← Razorpay order + verify
        │   │   ├── StudentController.java
        │   │   ├── AdminController.java
        │   │   └── FeedbackController.java
        │   ├── service/
        │   │   └── RazorpayService.java      ← Razorpay SDK integration
        │   ├── model/
        │   │   ├── Student.java
        │   │   ├── Admin.java
        │   │   ├── Event.java
        │   │   ├── Registration.java
        │   │   ├── Payment.java
        │   │   └── Feedback.java
        │   ├── repository/  (6 interface files)
        │   ├── dto/         (8 DTO files)
        │   └── exception/   GlobalExceptionHandler.java
        └── resources/
            ├── application.properties      ← DB config + Razorpay keys
            └── application-dev.properties
```

---

## ⚙️ Setup — Step by Step

### 1. Prerequisites
| Tool | Version |
|------|---------|
| Java JDK | 17+ |
| Maven | 3.8+ |
| MySQL | 8.0+ |
| IntelliJ IDEA | Community or Ultimate |

---

### 2. Setup Database

Open IntelliJ Terminal (`Alt+F12`) and run:

```bash
cd path\to\smart-campus-events\database
mysql -u root -p < RESET_DATABASE.sql
```

This creates the `smart_campus_events` database with all 6 tables and sample data.

---

### 3. Configure Backend

Open `backend/src/main/resources/application.properties` and change the password:

```properties
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

Razorpay keys are already set:
```properties
razorpay.key.id=rzp_test_SWBzhiPerfRLph
razorpay.key.secret=077cnBxHW7XpVUBHRgKaBf7n
```

---

### 4. Run Backend

In IntelliJ Terminal:
```bash
cd path\to\smart-campus-events\backend
mvn spring-boot:run
```

Wait for: `Tomcat started on port(s): 8080` ✅

**OR** — in IntelliJ file tree, open `SmartCampusEventsApplication.java` → click green ▶ button

---

### 5. Open Frontend

In IntelliJ file tree → `frontend/pages/index.html` → click Chrome/Firefox icon → website opens!

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@iitindore.ac.in | admin123 |
| Student | aarav@gmail.com | pass123 |

---

## 💳 Razorpay Payment Flow

```
Student clicks Register on paid event
       ↓
Backend creates Razorpay Order
       ↓
Razorpay popup opens (UPI / Card / Net Banking / Wallet)
       ↓
Student completes payment
       ↓
Backend verifies signature (security check)
       ↓
Registration saved ✅ — Awaiting admin approval
```

### Test Payment Details (Test Mode)
| Field | Value |
|-------|-------|
| Card Number | 4111 1111 1111 1111 |
| Expiry | Any future date (e.g. 12/26) |
| CVV | Any 3 digits (e.g. 123) |
| OTP | 1234 |

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/student/register | Public | Register new student |
| POST | /api/auth/student/login | Public | Student login |
| POST | /api/auth/admin/login | Public | Admin login |
| GET | /api/events | Public | Get all events |
| POST | /api/payments/create-order | Student | Create Razorpay order |
| POST | /api/payments/verify | Student | Verify payment + save registration |
| POST | /api/payments/register-free | Student | Register for free event |
| GET | /api/payments/my-payments | Student | Payment history |
| GET | /api/registrations/my | Student | My registrations |
| PUT | /api/registrations/{id}/status | Admin | Approve/Reject |
| GET | /api/admin/all-students | Admin | All students |
| POST | /api/events | Admin | Create event |
| PUT | /api/events/{id} | Admin | Edit event |
| DELETE | /api/events/{id} | Admin | Delete event |

---

## ✨ Features

### Student
- Register with full academic details (Name, Enrollment, Roll No, Course, Branch, Mobile, Semester, Year)
- Login with Email or Mobile + Password
- Browse & search events by category
- **Real Razorpay payment** (UPI, Card, Net Banking, Wallet)
- Free event registration (no payment)
- Track registration status (Pending/Approved/Rejected)
- View payment history with transaction IDs
- Submit star ratings and feedback
- Edit profile & change password

### Admin
- Login with Email or Mobile
- Dashboard with stats (events, registrations, revenue)
- Create / Edit / Delete events
- Approve or Reject student registrations
- View all students with full details
- View feedback & ratings per event
- Edit profile & change password
