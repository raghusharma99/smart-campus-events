package com.smartcampus.dto;

import com.smartcampus.model.Event;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class EventDTO {

    /* ── Create / Update Request ──────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {

        @NotBlank(message = "Title is required")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Category is required")
        private Event.EventCategory category;

        @NotBlank(message = "Location is required")
        private String location;

        @NotNull(message = "Start date is required")
        private LocalDate startDate;

        @NotNull(message = "End date is required")
        private LocalDate endDate;

        @DecimalMin(value = "0.0", message = "Fee cannot be negative")
        private BigDecimal fee = BigDecimal.ZERO;

        @Min(value = 1, message = "Slots must be at least 1")
        private Integer totalSlots;

        private Event.EventStatus status = Event.EventStatus.ACTIVE;
    }

    /* ── Response ─────────────────────────────────── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long          id;
        private String        title;
        private String        description;
        private String        category;
        private String        location;
        private String        college;
        private LocalDate     startDate;
        private LocalDate     endDate;
        private BigDecimal    fee;
        private Integer       totalSlots;
        private Integer       filledSlots;
        private String        status;
        private String        bannerUrl;
        private Long          createdById;
        private String        createdByName;
        private LocalDateTime createdAt;
    }
}
