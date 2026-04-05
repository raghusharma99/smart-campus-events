package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.PasswordDTO;
import com.smartcampus.dto.StudentDTO;
import com.smartcampus.model.Student;
import com.smartcampus.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
public class StudentController {

    private final StudentRepository studentRepo;
    private final PasswordEncoder   encoder;

    /* ── GET my profile ─────────────────────────── */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getProfile(HttpServletRequest req) {
        Long id = (Long) req.getAttribute("userId");
        Student s = studentRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Student not found"));
        return ResponseEntity.ok(ApiResponse.ok("Profile fetched", toResponse(s)));
    }

    /* ── PUT update profile ─────────────────────── */
    @PutMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody StudentDTO.UpdateRequest body,
            HttpServletRequest req) {

        Long id = (Long) req.getAttribute("userId");
        Student s = studentRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Student not found"));

        s.setName(body.getName());
        s.setEnrollmentNo(body.getEnrollmentNo());
        s.setRollNo(body.getRollNo());
        s.setCourse(body.getCourse());
        s.setBranch(body.getBranch());
        s.setMobile(body.getMobile());
        s.setSemester(body.getSemester());
        s.setYear(body.getYear());
        s.setEmail(body.getEmail());
        if (body.getCollege() != null) s.setCollege(body.getCollege());

        studentRepo.save(s);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", toResponse(s)));
    }

    /* ── PUT change password ────────────────────── */
    @PutMapping("/change-password")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody PasswordDTO body,
            HttpServletRequest req) {

        Long id = (Long) req.getAttribute("userId");
        Student s = studentRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Student not found"));

        if (!encoder.matches(body.getCurrentPassword(), s.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Current password is incorrect"));
        }
        if (!body.getNewPassword().equals(body.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("New passwords do not match"));
        }

        s.setPassword(encoder.encode(body.getNewPassword()));
        studentRepo.save(s);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }

    /* ── Helper: entity → DTO ───────────────────── */
    private StudentDTO.Response toResponse(Student s) {
        return StudentDTO.Response.builder()
                .id(s.getId())
                .name(s.getName())
                .enrollmentNo(s.getEnrollmentNo())
                .rollNo(s.getRollNo())
                .course(s.getCourse())
                .branch(s.getBranch())
                .mobile(s.getMobile())
                .semester(s.getSemester())
                .year(s.getYear())
                .email(s.getEmail())
                .college(s.getCollege())
                .profilePic(s.getProfilePic())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
