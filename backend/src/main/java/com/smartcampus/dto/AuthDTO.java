package com.smartcampus.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class AuthDTO {

    /* ── Login Request ────────────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {

        @NotBlank(message = "Email or mobile is required")
        private String identifier;   // accepts email OR mobile number

        @NotBlank(message = "Password is required")
        private String password;
    }

    /* ── Login Response ───────────────────────────── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginResponse {
        private boolean success;
        private String  token;
        private String  role;
        private Object  user;
    }
}
