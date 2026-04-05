package com.smartcampus.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

public class StudentDTO {

    /* ── Register Request ─────────────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Enrollment number is required")
        private String enrollmentNo;

        @NotBlank(message = "Roll number is required")
        private String rollNo;

        @NotBlank(message = "Course is required")
        private String course;

        @NotBlank(message = "Branch is required")
        private String branch;

        @NotBlank(message = "Mobile is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile must be 10 digits")
        private String mobile;

        @Min(value = 1, message = "Semester must be 1-8")
        @Max(value = 8, message = "Semester must be 1-8")
        private Integer semester;

        @Min(value = 1, message = "Year must be 1-4")
        @Max(value = 4, message = "Year must be 1-4")
        private Integer year;

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "College name is required")
        private String college;
    }

    /* ── Update Profile Request ───────────────────── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Enrollment number is required")
        private String enrollmentNo;

        @NotBlank(message = "Roll number is required")
        private String rollNo;

        @NotBlank(message = "Course is required")
        private String course;

        @NotBlank(message = "Branch is required")
        private String branch;

        @Pattern(regexp = "^[0-9]{10}$", message = "Mobile must be 10 digits")
        private String mobile;

        @Min(1) @Max(8)
        private Integer semester;

        @Min(1) @Max(4)
        private Integer year;

        @Email(message = "Enter a valid email")
        private String email;

        private String college;
    }

    /* ── Profile Response ─────────────────────────── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long          id;
        private String        name;
        private String        enrollmentNo;
        private String        rollNo;
        private String        course;
        private String        branch;
        private String        mobile;
        private Integer       semester;
        private Integer       year;
        private String        email;
        private String        college;
        private String        profilePic;
        private LocalDateTime createdAt;
    }
}
