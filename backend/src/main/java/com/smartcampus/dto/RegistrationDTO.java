package com.smartcampus.dto;

import com.smartcampus.model.Registration;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class RegistrationDTO {

    /* ── Register Request ─────────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "Event ID is required")
        private Long eventId;

        private Registration.PaymentMethod paymentMethod;

        // Card payment details
        private String cardNumber;
        private String cardExpiry;
        private String cardCvv;
        private String cardHolderName;

        // UPI payment details
        private String upiId;
    }

    /* ── Status Update Request ────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        @NotNull(message = "Status is required")
        private Registration.RegistrationStatus status;
    }

    /* ── Response ─────────────────────────────────── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long          id;
        private Long          eventId;
        private String        eventTitle;
        private Long          studentId;
        private String        studentName;
        private String        studentEmail;
        private String        studentMobile;
        private String        enrollmentNo;
        private String        status;
        private String        paymentStatus;
        private String        paymentMethod;
        private BigDecimal    amountPaid;
        private String        transactionId;
        private LocalDateTime registeredAt;
    }
}
