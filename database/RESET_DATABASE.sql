-- ══════════════════════════════════════════════════════════════
-- Smart Campus Events — COMPLETE DATABASE RESET SCRIPT
-- ══════════════════════════════════════════════════════════════



USE smart_campus_events;

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: admins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admins (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL,
    contact     VARCHAR(15)     NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    college     VARCHAR(150)    NOT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'COLLEGE_ADMIN',
    profile_pic VARCHAR(255)    NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_email   (email),
    UNIQUE KEY uk_admin_contact (contact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
-- TABLE 2: students
-- ─────────────────────────────────────────────────────────────
CREATE TABLE students (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)    NOT NULL,
    enrollment_no VARCHAR(50)     NOT NULL,
    roll_no       VARCHAR(50)     NOT NULL,
    course        VARCHAR(50)     NOT NULL,
    branch        VARCHAR(100)    NOT NULL,
    mobile        VARCHAR(15)     NOT NULL,
    semester      INT             NOT NULL,
    year          INT             NOT NULL,
    email         VARCHAR(150)    NOT NULL,
    password      VARCHAR(255)    NOT NULL,
    college       VARCHAR(150)    NOT NULL,
    profile_pic   VARCHAR(255)    NULL,
    is_active     TINYINT(1)      NOT NULL DEFAULT 1,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_email       (email),
    UNIQUE KEY uk_student_mobile      (mobile),
    UNIQUE KEY uk_student_enrollment  (enrollment_no),
    UNIQUE KEY uk_student_rollno      (roll_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
-- TABLE 3: events  (FK → admins)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE events (
    id           BIGINT          NOT NULL AUTO_INCREMENT,
    title        VARCHAR(200)    NOT NULL,
    description  TEXT            NOT NULL,
    category     ENUM('SPORTS','HACKATHON','CULTURAL','WORKSHOP','SEMINAR','QUIZ') NOT NULL,
    location     VARCHAR(255)    NOT NULL,
    college      VARCHAR(150)    NOT NULL,
    start_date   DATE            NULL,
    end_date     DATE            NULL,
    fee          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    total_slots  INT             NOT NULL,
    filled_slots INT             NOT NULL DEFAULT 0,
    status       ENUM('ACTIVE','DRAFT','CANCELLED','COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    banner_url   VARCHAR(255)    NULL,
    created_by   BIGINT          NOT NULL,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_event_admin FOREIGN KEY (created_by) REFERENCES admins (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
-- TABLE 4: registrations  (FK → students, events)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE registrations (
    id             BIGINT          NOT NULL AUTO_INCREMENT,
    student_id     BIGINT          NOT NULL,
    event_id       BIGINT          NOT NULL,
    status         ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    payment_status ENUM('PENDING','PAID','FREE','REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_method ENUM('CARD','UPI','NET_BANKING','FREE') NULL,
    amount_paid    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    transaction_id VARCHAR(100)    NULL,
    registered_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_event (student_id, event_id),
    CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_reg_event   FOREIGN KEY (event_id)   REFERENCES events   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
-- TABLE 5: payments  (FK → registrations, students, events)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE payments (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    registration_id BIGINT          NOT NULL,
    student_id      BIGINT          NOT NULL,
    event_id        BIGINT          NOT NULL,
    amount          DECIMAL(10,2)   NOT NULL,
    payment_method  ENUM('CARD','UPI','NET_BANKING') NOT NULL,
    transaction_id  VARCHAR(100)    NOT NULL,
    status          ENUM('SUCCESS','FAILED','PENDING','REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_transaction (transaction_id),
    CONSTRAINT fk_pay_reg     FOREIGN KEY (registration_id) REFERENCES registrations (id),
    CONSTRAINT fk_pay_student FOREIGN KEY (student_id)      REFERENCES students      (id),
    CONSTRAINT fk_pay_event   FOREIGN KEY (event_id)        REFERENCES events        (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────────────────────
-- TABLE 6: feedback  (FK → students, events)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE feedback (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    student_id BIGINT      NOT NULL,
    event_id   BIGINT      NOT NULL,
    rating     INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT        NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_feedback (student_id, event_id),
    CONSTRAINT fk_fb_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_fb_event   FOREIGN KEY (event_id)   REFERENCES events   (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


