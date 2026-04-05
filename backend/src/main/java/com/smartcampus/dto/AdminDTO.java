package com.smartcampus.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

public class AdminDTO {

    /* ── Update Profile Request ───────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        private String email;

        @NotBlank(message = "Contact is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Contact must be 10 digits")
        private String contact;
    }

    /* ── Profile Response ─────────────────────────── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long          id;
        private String        name;
        private String        email;
        private String        contact;
        private String        college;
        private String        role;
        private String        profilePic;
        private LocalDateTime createdAt;
    }
}
