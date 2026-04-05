package com.smartcampus.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

public class FeedbackDTO {

    /* ── Submit Request ───────────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {

        @NotNull(message = "Event ID is required")
        private Long eventId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        private Integer rating;

        private String comment;
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
        private Integer       rating;
        private String        comment;
        private LocalDateTime createdAt;
    }
}
