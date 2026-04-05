package com.smartcampus.controller;

import com.smartcampus.model.*;
import com.smartcampus.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationRepository regRepo;
    private final EventRepository        eventRepo;
    private final StudentRepository      studentRepo;
    private final PaymentRepository      paymentRepo;

    // ─── Student registers for event ──────────────────
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        Long studentId = (Long) req.getAttribute("userId");
        Long eventId   = Long.parseLong(body.get("eventId").toString());

        if (regRepo.existsByStudentIdAndEventId(studentId, eventId))
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Already registered for this event"));

        var event   = eventRepo.findById(eventId).orElseThrow();
        var student = studentRepo.findById(studentId).orElseThrow();

        if (event.getFilledSlots() >= event.getTotalSlots())
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "No slots available"));

        // Determine payment method
        String payMethodStr = (String) body.get("paymentMethod");
        Registration.PaymentMethod payMethod = null;
        Registration.PaymentStatus payStatus;
        BigDecimal amountPaid = BigDecimal.ZERO;
        String transactionId  = null;

        if (event.getFee().compareTo(BigDecimal.ZERO) == 0) {
            payStatus = Registration.PaymentStatus.FREE;
            payMethod = Registration.PaymentMethod.FREE;
        } else {
            payMethod  = Registration.PaymentMethod.valueOf(payMethodStr != null ? payMethodStr.toUpperCase() : "CARD");
            payStatus  = Registration.PaymentStatus.PAID;
            amountPaid = event.getFee();
            transactionId = "TXN_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();

            // Record payment
            Payment payment = Payment.builder()
                .registration(null)  // will set after save
                .student(student)
                .event(event)
                .amount(amountPaid)
                .paymentMethod(Payment.PaymentMethod.valueOf(payMethod.name()))
                .transactionId(transactionId)
                .status(Payment.PaymentStatus.SUCCESS)
                .build();
            paymentRepo.save(payment);
        }

        Registration reg = Registration.builder()
            .student(student)
            .event(event)
            .status(Registration.RegistrationStatus.PENDING)
            .paymentStatus(payStatus)
            .paymentMethod(payMethod)
            .amountPaid(amountPaid)
            .transactionId(transactionId)
            .build();

        regRepo.save(reg);

        // Increment filled slots
        event.setFilledSlots(event.getFilledSlots() + 1);
        eventRepo.save(event);

        return ResponseEntity.ok(Map.of("success", true, "message", "Registered successfully! Awaiting approval.", "data", toMap(reg)));
    }

    // ─── Get my registrations (student) ───────────────
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyRegistrations(HttpServletRequest req) {
        Long studentId = (Long) req.getAttribute("userId");
        List<Map<String, Object>> list = regRepo.findByStudentId(studentId)
            .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    // ─── Get registrations for an event (admin) ────────
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventRegistrations(@PathVariable Long eventId) {
        List<Map<String, Object>> list = regRepo.findByEventId(eventId)
            .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    // ─── Get all registrations under this admin ────────
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllRegistrationsForAdmin(HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");
        List<Map<String, Object>> list = regRepo.findAllByAdminId(adminId)
            .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    // ─── Approve or reject registration (admin) ────────
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var reg = regRepo.findById(id).orElseThrow();
        String newStatus = body.get("status").toUpperCase();
        reg.setStatus(Registration.RegistrationStatus.valueOf(newStatus));
        regRepo.save(reg);
        return ResponseEntity.ok(Map.of("success", true, "message", "Registration " + newStatus.toLowerCase()));
    }

    // ─── Helper ───────────────────────────────────────
    private Map<String, Object> toMap(Registration r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",            r.getId());
        m.put("eventId",       r.getEvent().getId());
        m.put("eventTitle",    r.getEvent().getTitle());
        m.put("studentId",     r.getStudent().getId());
        m.put("studentName",   r.getStudent().getName());
        m.put("studentEmail",  r.getStudent().getEmail());
        m.put("studentMobile", r.getStudent().getMobile());
        m.put("enrollmentNo",  r.getStudent().getEnrollmentNo());
        m.put("status",        r.getStatus().name());
        m.put("paymentStatus", r.getPaymentStatus().name());
        m.put("paymentMethod", r.getPaymentMethod() != null ? r.getPaymentMethod().name() : null);
        m.put("amountPaid",    r.getAmountPaid());
        m.put("transactionId", r.getTransactionId());
        m.put("registeredAt",  r.getRegisteredAt().toString());
        return m;
    }
}
