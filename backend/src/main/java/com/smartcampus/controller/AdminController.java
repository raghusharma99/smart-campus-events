package com.smartcampus.controller;

import com.smartcampus.dto.AdminDTO;
import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.PasswordDTO;
import com.smartcampus.model.Admin;
import com.smartcampus.model.Registration;
import com.smartcampus.repository.AdminRepository;
import com.smartcampus.repository.PaymentRepository;
import com.smartcampus.repository.RegistrationRepository;
import com.smartcampus.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminRepository        adminRepo;
    private final StudentRepository      studentRepo;
    private final RegistrationRepository regRepo;
    private final PaymentRepository      paymentRepo;
    private final PasswordEncoder        encoder;

    /* ── GET admin profile ──────────────────────── */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getProfile(HttpServletRequest req) {
        Long id = (Long) req.getAttribute("userId");
        Admin a = adminRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Admin not found"));
        return ResponseEntity.ok(ApiResponse.ok("Profile fetched", toResponse(a)));
    }

    /* ── PUT update profile ─────────────────────── */
    @PutMapping("/profile")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody AdminDTO.UpdateRequest body,
            HttpServletRequest req) {

        Long id = (Long) req.getAttribute("userId");
        Admin a = adminRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Admin not found"));

        a.setName(body.getName());
        a.setEmail(body.getEmail());
        a.setContact(body.getContact());

        adminRepo.save(a);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", toResponse(a)));
    }

    /* ── PUT change password ────────────────────── */
    @PutMapping("/change-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody PasswordDTO body,
            HttpServletRequest req) {

        Long id = (Long) req.getAttribute("userId");
        Admin a = adminRepo.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Admin not found"));

        if (!encoder.matches(body.getCurrentPassword(), a.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Current password is incorrect"));
        }
        if (!body.getNewPassword().equals(body.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Passwords do not match"));
        }

        a.setPassword(encoder.encode(body.getNewPassword()));
        adminRepo.save(a);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }

    /* ── GET all students ───────────────────────── */
    @GetMapping("/all-students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllStudents() {
        // NOTE: Map.of() supports max 10 entries — using HashMap for 11+ fields
        var list = studentRepo.findAll().stream().map(s -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",           s.getId());
            m.put("name",         s.getName());
            m.put("email",        s.getEmail());
            m.put("mobile",       s.getMobile());
            m.put("enrollmentNo", s.getEnrollmentNo());
            m.put("rollNo",       s.getRollNo());
            m.put("course",       s.getCourse());
            m.put("branch",       s.getBranch());
            m.put("semester",     s.getSemester());
            m.put("year",         s.getYear());
            m.put("college",      s.getCollege());
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Students fetched", list));
    }

    /* ── GET dashboard stats ────────────────────── */
    @GetMapping("/dashboard-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getDashboardStats(HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");

        long totalRegs   = regRepo.findAllByAdminId(adminId).size();
        long pendingRegs = regRepo.findByAdminIdAndStatus(
                adminId, Registration.RegistrationStatus.PENDING).size();
        Double revenue   = paymentRepo.sumRevenueByAdminId(adminId);

        var stats = Map.of(
                "totalRegistrations", totalRegs,
                "pendingApprovals",   pendingRegs,
                "totalRevenue",       revenue != null ? revenue : 0.0
        );
        return ResponseEntity.ok(ApiResponse.ok("Stats fetched", stats));
    }

    /* ── Helper: entity → DTO ───────────────────── */
    private AdminDTO.Response toResponse(Admin a) {
        return AdminDTO.Response.builder()
                .id(a.getId())
                .name(a.getName())
                .email(a.getEmail())
                .contact(a.getContact())
                .college(a.getCollege())
                .role(a.getRole())
                .profilePic(a.getProfilePic())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
