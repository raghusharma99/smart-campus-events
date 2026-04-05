package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.model.Event;
import com.smartcampus.model.Payment;
import com.smartcampus.model.Registration;
import com.smartcampus.model.Student;
import com.smartcampus.repository.EventRepository;
import com.smartcampus.repository.PaymentRepository;
import com.smartcampus.repository.RegistrationRepository;
import com.smartcampus.repository.StudentRepository;
import com.smartcampus.service.RazorpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Payment Controller — Razorpay Integration
 *
 * Flow:
 *  1. Frontend calls POST /payments/create-order  → gets Razorpay order_id
 *  2. Frontend opens Razorpay popup using order_id
 *  3. Student pays → Razorpay calls success handler with payment_id + signature
 *  4. Frontend calls POST /payments/verify        → backend verifies signature
 *  5. On success → registration is saved + marked PAID
 */
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final RazorpayService       razorpayService;
    private final EventRepository       eventRepo;
    private final StudentRepository     studentRepo;
    private final RegistrationRepository regRepo;
    private final PaymentRepository     paymentRepo;

    /* ═══════════════════════════════════════════════
       STEP 1 — Create Razorpay Order
       Called BEFORE showing the payment popup
       ═══════════════════════════════════════════════ */
    @PostMapping("/create-order")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body,
                                          HttpServletRequest req) {
        try {
            Long studentId = (Long) req.getAttribute("userId");
            Long eventId   = Long.parseLong(body.get("eventId").toString());

            Event event = eventRepo.findById(eventId)
                    .orElseThrow(() -> new RuntimeException("Event not found"));

            // Check already registered
            if (regRepo.existsByStudentIdAndEventId(studentId, eventId)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Already registered for this event"));
            }

            // Check slots
            if (event.getFilledSlots() >= event.getTotalSlots()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No slots available"));
            }

            // Create unique receipt ID
            String receipt = "SCE_" + studentId + "_" + eventId + "_"
                             + System.currentTimeMillis();

            // Create Razorpay order
            Map<String, Object> order = razorpayService.createOrder(
                    event.getFee(), "INR", receipt);

            // Add event info for frontend display
            order.put("eventId",    eventId);
            order.put("eventTitle", event.getTitle());
            order.put("eventFee",   event.getFee());

            return ResponseEntity.ok(ApiResponse.ok("Order created", order));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to create order: " + e.getMessage()));
        }
    }

    /* ═══════════════════════════════════════════════
       STEP 2 — Verify Payment & Save Registration
       Called AFTER student completes payment in popup
       ═══════════════════════════════════════════════ */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> body,
                                            HttpServletRequest req) {
        try {
            Long studentId = (Long) req.getAttribute("userId");

            String razorpayOrderId   = (String) body.get("razorpayOrderId");
            String razorpayPaymentId = (String) body.get("razorpayPaymentId");
            String razorpaySignature = (String) body.get("razorpaySignature");
            Long   eventId           = Long.parseLong(body.get("eventId").toString());

            // ── VERIFY SIGNATURE (SECURITY CRITICAL) ──────────
            boolean isValid = razorpayService.verifyPaymentSignature(
                    razorpayOrderId, razorpayPaymentId, razorpaySignature);

            if (!isValid) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(
                            "Payment verification failed — invalid signature. " +
                            "Please contact support."));
            }

            // ── SIGNATURE OK — Save registration & payment ─────
            Event   event   = eventRepo.findById(eventId).orElseThrow();
            Student student = studentRepo.findById(studentId).orElseThrow();

            // Save registration
            Registration reg = Registration.builder()
                    .student(student)
                    .event(event)
                    .status(Registration.RegistrationStatus.PENDING)
                    .paymentStatus(Registration.PaymentStatus.PAID)
                    .paymentMethod(Registration.PaymentMethod.CARD) // Razorpay handles method
                    .amountPaid(event.getFee())
                    .transactionId(razorpayPaymentId)
                    .build();
            regRepo.save(reg);

            // Save payment record
            Payment payment = Payment.builder()
                    .registration(reg)
                    .student(student)
                    .event(event)
                    .amount(event.getFee())
                    .paymentMethod(Payment.PaymentMethod.CARD)
                    .transactionId(razorpayPaymentId)
                    .status(Payment.PaymentStatus.SUCCESS)
                    .build();
            paymentRepo.save(payment);

            // Increment filled slots
            event.setFilledSlots(event.getFilledSlots() + 1);
            eventRepo.save(event);

            // Build response
            Map<String, Object> result = new HashMap<>();
            result.put("registrationId", reg.getId());
            result.put("paymentId",      razorpayPaymentId);
            result.put("amount",         event.getFee());
            result.put("eventTitle",     event.getTitle());
            result.put("status",         "PAID");

            return ResponseEntity.ok(ApiResponse.ok(
                "Payment successful! Registration pending admin approval.", result));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Payment processing failed: " + e.getMessage()));
        }
    }

    /* ═══════════════════════════════════════════════
       FREE EVENT — Register without payment
       ═══════════════════════════════════════════════ */
    @PostMapping("/register-free")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> registerFree(@RequestBody Map<String, Object> body,
                                           HttpServletRequest req) {
        try {
            Long studentId = (Long) req.getAttribute("userId");
            Long eventId   = Long.parseLong(body.get("eventId").toString());

            Event   event   = eventRepo.findById(eventId).orElseThrow();
            Student student = studentRepo.findById(studentId).orElseThrow();

            if (event.getFee().compareTo(BigDecimal.ZERO) != 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("This event is not free"));
            }
            if (regRepo.existsByStudentIdAndEventId(studentId, eventId)) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Already registered"));
            }
            if (event.getFilledSlots() >= event.getTotalSlots()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No slots available"));
            }

            Registration reg = Registration.builder()
                    .student(student)
                    .event(event)
                    .status(Registration.RegistrationStatus.PENDING)
                    .paymentStatus(Registration.PaymentStatus.FREE)
                    .paymentMethod(Registration.PaymentMethod.FREE)
                    .amountPaid(BigDecimal.ZERO)
                    .transactionId("FREE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .build();
            regRepo.save(reg);

            event.setFilledSlots(event.getFilledSlots() + 1);
            eventRepo.save(event);

            return ResponseEntity.ok(ApiResponse.ok(
                "Registered successfully! Awaiting admin approval.", null));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    /* ═══════════════════════════════════════════════
       GET payment history for student
       ═══════════════════════════════════════════════ */
    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyPayments(HttpServletRequest req) {
        Long studentId = (Long) req.getAttribute("userId");
        var payments = paymentRepo.findByStudentId(studentId).stream().map(p -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",            p.getId());
            m.put("eventId",       p.getEvent().getId());
            m.put("eventTitle",    p.getEvent().getTitle());
            m.put("amount",        p.getAmount());
            m.put("paymentMethod", p.getPaymentMethod().name());
            m.put("transactionId", p.getTransactionId());
            m.put("status",        p.getStatus().name());
            m.put("paymentDate",   p.getPaymentDate().toString());
            return m;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok("Payments fetched", payments));
    }
}
