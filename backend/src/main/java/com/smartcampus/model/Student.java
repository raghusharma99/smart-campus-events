package com.smartcampus.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Enrollment number is required")
    @Column(name = "enrollment_no", nullable = false, unique = true, length = 50)
    private String enrollmentNo;

    @NotBlank(message = "Roll number is required")
    @Column(name = "roll_no", nullable = false, unique = true, length = 50)
    private String rollNo;

    @NotBlank(message = "Course is required")
    @Column(nullable = false, length = 50)
    private String course;

    @NotBlank(message = "Branch is required")
    @Column(nullable = false, length = 100)
    private String branch;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile must be 10 digits")
    @Column(nullable = false, unique = true, length = 15)
    private String mobile;

    @Min(value = 1, message = "Semester must be between 1 and 8")
    @Max(value = 8, message = "Semester must be between 1 and 8")
    @Column(nullable = false)
    private Integer semester;

    @Min(value = 1, message = "Year must be between 1 and 4")
    @Max(value = 4, message = "Year must be between 1 and 4")
    @Column(nullable = false)
    private Integer year;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "College name is required")
    @Column(nullable = false, length = 150)
    private String college;

    @Column(name = "profile_pic")
    private String profilePic;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
