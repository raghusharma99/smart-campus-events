package com.smartcampus.controller;

import com.smartcampus.dto.ApiResponse;
import com.smartcampus.dto.FeedbackDTO;
import com.smartcampus.model.Feedback;
import com.smartcampus.repository.EventRepository;
import com.smartcampus.repository.FeedbackRepository;
import com.smartcampus.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepo;
    private final EventRepository    eventRepo;
    private final StudentRepository  studentRepo;

    /* ── POST submit feedback ───────────────────── */
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitFeedback(
            @Valid @RequestBody FeedbackDTO.CreateRequest body,
            HttpServletRequest req) {

        Long studentId = (Long) req.getAttribute("userId");

        if (feedbackRepo.existsByStudentIdAndEventId(studentId, body.getEventId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("You have already submitted feedback for this event"));
        }

        var event   = eventRepo.findById(body.getEventId())
                .orElseThrow(() -> new java.util.NoSuchElementException("Event not found"));
        var student = studentRepo.findById(studentId)
                .orElseThrow(() -> new java.util.NoSuchElementException("Student not found"));

        Feedback fb = Feedback.builder()
                .student(student)
                .event(event)
                .rating(body.getRating())
                .comment(body.getComment())
                .build();

        feedbackRepo.save(fb);
        return ResponseEntity.ok(ApiResponse.ok("Feedback submitted successfully", null));
    }

    /* ── GET my feedback (student) ──────────────── */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getMyFeedback(HttpServletRequest req) {
        Long studentId = (Long) req.getAttribute("userId");
        List<FeedbackDTO.Response> list = feedbackRepo.findByStudentId(studentId)
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Feedback fetched", list));
    }

    /* ── GET feedback for an event (admin) ──────── */
    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getEventFeedback(@PathVariable Long eventId) {
        List<FeedbackDTO.Response> list = feedbackRepo.findByEventId(eventId)
                .stream().map(this::toResponse).collect(Collectors.toList());
        Double avgRating = feedbackRepo.findAverageRatingByEventId(eventId);

        return ResponseEntity.ok(Map.of(
                "success",       true,
                "data",          list,
                "averageRating", avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0,
                "totalReviews",  list.size()
        ));
    }

    /* ── Helper: entity → DTO ───────────────────── */
    private FeedbackDTO.Response toResponse(Feedback f) {
        return FeedbackDTO.Response.builder()
                .id(f.getId())
                .eventId(f.getEvent().getId())
                .eventTitle(f.getEvent().getTitle())
                .studentId(f.getStudent().getId())
                .studentName(f.getStudent().getName())
                .rating(f.getRating())
                .comment(f.getComment())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
