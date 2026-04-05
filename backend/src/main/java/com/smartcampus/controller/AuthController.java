package com.smartcampus.controller;

import com.smartcampus.config.JwtUtils;
import com.smartcampus.dto.AuthDTO;
import com.smartcampus.dto.StudentDTO;
import com.smartcampus.model.Admin;
import com.smartcampus.model.Student;
import com.smartcampus.repository.AdminRepository;
import com.smartcampus.repository.StudentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final StudentRepository studentRepo;
    private final AdminRepository   adminRepo;
    private final PasswordEncoder   encoder;
    private final JwtUtils          jwtUtils;

    /* ── POST  /auth/student/register ──────────── */
    @PostMapping("/student/register")
    public ResponseEntity<?> registerStudent(
            @Valid @RequestBody StudentDTO.RegisterRequest body) {

        if (studentRepo.existsByEmail(body.getEmail()))
            return ResponseEntity.badRequest().body(error("Email is already registered"));
        if (studentRepo.existsByMobile(body.getMobile()))
            return ResponseEntity.badRequest().body(error("Mobile number is already registered"));
        if (studentRepo.existsByEnrollmentNo(body.getEnrollmentNo()))
            return ResponseEntity.badRequest().body(error("Enrollment number already exists"));
        if (studentRepo.existsByRollNo(body.getRollNo()))
            return ResponseEntity.badRequest().body(error("Roll number already exists"));

        Student student = Student.builder()
                .name(body.getName())
                .enrollmentNo(body.getEnrollmentNo())
                .rollNo(body.getRollNo())
                .course(body.getCourse())
                .branch(body.getBranch())
                .mobile(body.getMobile())
                .semester(body.getSemester())
                .year(body.getYear())
                .email(body.getEmail())
                .password(encoder.encode(body.getPassword()))
                .college(body.getCollege())
                .build();

        studentRepo.save(student);
        return ResponseEntity.ok(success("Account created successfully! Please login.", null));
    }

    /* ── POST  /auth/student/login ──────────────── */
    @PostMapping("/student/login")
    public ResponseEntity<?> loginStudent(
            @Valid @RequestBody AuthDTO.LoginRequest body) {

        Optional<Student> opt = studentRepo.findByEmailOrMobile(
                body.getIdentifier(), body.getIdentifier());

        if (opt.isEmpty() || !encoder.matches(body.getPassword(), opt.get().getPassword())) {
            return ResponseEntity.status(401).body(error("Invalid email/mobile or password"));
        }

        Student s     = opt.get();
        String  token = jwtUtils.generateToken(s.getEmail(), "STUDENT", s.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token",   token,
                "role",    "STUDENT",
                "user",    studentMap(s)
        ));
    }

    /* ── POST  /auth/admin/login ────────────────── */
    @PostMapping("/admin/login")
    public ResponseEntity<?> loginAdmin(
            @Valid @RequestBody AuthDTO.LoginRequest body) {

        Optional<Admin> opt = adminRepo.findByEmailOrContact(
                body.getIdentifier(), body.getIdentifier());

        if (opt.isEmpty() || !encoder.matches(body.getPassword(), opt.get().getPassword())) {
            return ResponseEntity.status(401).body(error("Invalid email/mobile or password"));
        }

        Admin  a     = opt.get();
        String token = jwtUtils.generateToken(a.getEmail(), "ADMIN", a.getId());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "token",   token,
                "role",    "ADMIN",
                "user",    adminMap(a)
        ));
    }

    /* ── Helpers ────────────────────────────────── */
    private Map<String, Object> studentMap(Student s) {
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
        m.put("role",         "STUDENT");
        return m;
    }

    private Map<String, Object> adminMap(Admin a) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",      a.getId());
        m.put("name",    a.getName());
        m.put("email",   a.getEmail());
        m.put("contact", a.getContact());
        m.put("college", a.getCollege());
        m.put("role",    "ADMIN");
        return m;
    }

    private Map<String, Object> success(String msg, Object data) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", true);
        m.put("message", msg);
        if (data != null) m.put("data", data);
        return m;
    }

    private Map<String, Object> error(String msg) {
        return Map.of("success", false, "message", msg);
    }
}
