-- ============================================================
-- Smart Campus Events Platform - Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_campus_events;
USE smart_campus_events;

-- ─────────────────────────────────────────
-- TABLE: admins
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    contact       VARCHAR(15)         NOT NULL UNIQUE,
    password      VARCHAR(255)        NOT NULL,
    college       VARCHAR(150)        NOT NULL,
    role          VARCHAR(50)         NOT NULL DEFAULT 'COLLEGE_ADMIN',
    profile_pic   VARCHAR(255),
    created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLE: students
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    enrollment_no VARCHAR(50)         NOT NULL UNIQUE,
    roll_no       VARCHAR(50)         NOT NULL UNIQUE,
    course        VARCHAR(50)         NOT NULL,
    branch        VARCHAR(100)        NOT NULL,
    mobile        VARCHAR(15)         NOT NULL UNIQUE,
    semester      INT                 NOT NULL,
    year          INT                 NOT NULL,
    email         VARCHAR(150)        NOT NULL UNIQUE,
    password      VARCHAR(255)        NOT NULL,
    college       VARCHAR(150)        NOT NULL,
    profile_pic   VARCHAR(255),
    is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- TABLE: events
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200)        NOT NULL,
    description   TEXT                NOT NULL,
    category      ENUM(
                    'SPORTS','HACKATHON','CULTURAL',
                    'WORKSHOP','SEMINAR','QUIZ'
                  )                   NOT NULL,
    location      VARCHAR(255)        NOT NULL,
    college       VARCHAR(150)        NOT NULL,
    start_date    DATE                NOT NULL,
    end_date      DATE                NOT NULL,
    fee           DECIMAL(10,2)       NOT NULL DEFAULT 0.00,
    total_slots   INT                 NOT NULL,
    filled_slots  INT                 NOT NULL DEFAULT 0,
    status        ENUM(
                    'ACTIVE','DRAFT','CANCELLED','COMPLETED'
                  )                   NOT NULL DEFAULT 'ACTIVE',
    banner_url    VARCHAR(255),
    created_by    BIGINT              NOT NULL,
    created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_admin FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- ─────────────────────────────────────────
-- TABLE: registrations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id     BIGINT             NOT NULL,
    event_id       BIGINT             NOT NULL,
    status         ENUM(
                     'PENDING','APPROVED','REJECTED'
                   )                  NOT NULL DEFAULT 'PENDING',
    payment_status ENUM(
                     'PENDING','PAID','FREE','REFUNDED'
                   )                  NOT NULL DEFAULT 'PENDING',
    payment_method ENUM(
                     'CARD','UPI','NET_BANKING','FREE'
                   ),
    amount_paid    DECIMAL(10,2)      NOT NULL DEFAULT 0.00,
    transaction_id VARCHAR(100),
    registered_at  TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_reg_event   FOREIGN KEY (event_id)   REFERENCES events(id),
    CONSTRAINT uq_student_event UNIQUE (student_id, event_id)
);

-- ─────────────────────────────────────────
-- TABLE: payments
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    registration_id BIGINT             NOT NULL,
    student_id      BIGINT             NOT NULL,
    event_id        BIGINT             NOT NULL,
    amount          DECIMAL(10,2)      NOT NULL,
    payment_method  ENUM(
                      'CARD','UPI','NET_BANKING'
                    )                  NOT NULL,
    transaction_id  VARCHAR(100)       NOT NULL UNIQUE,
    status          ENUM(
                      'SUCCESS','FAILED','PENDING','REFUNDED'
                    )                  NOT NULL DEFAULT 'PENDING',
    payment_date    TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_reg     FOREIGN KEY (registration_id) REFERENCES registrations(id),
    CONSTRAINT fk_pay_student FOREIGN KEY (student_id)      REFERENCES students(id),
    CONSTRAINT fk_pay_event   FOREIGN KEY (event_id)        REFERENCES events(id)
);

-- ─────────────────────────────────────────
-- TABLE: feedback
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id  BIGINT          NOT NULL,
    event_id    BIGINT          NOT NULL,
    rating      INT             NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fb_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_fb_event   FOREIGN KEY (event_id)   REFERENCES events(id),
    CONSTRAINT uq_student_feedback UNIQUE (student_id, event_id)
);
