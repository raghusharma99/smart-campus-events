package com.smartcampus.controller;

import com.smartcampus.model.Event;
import com.smartcampus.repository.AdminRepository;
import com.smartcampus.repository.EventRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepo;
    private final AdminRepository adminRepo;

    // ─── GET all active events (public) ──────────────────────
    @GetMapping
    public ResponseEntity<?> getAllEvents(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {

        List<Event> events;
        if (keyword != null && !keyword.isBlank()) {
            events = eventRepo.searchActiveEvents(keyword);
        } else if (category != null && !category.isBlank()) {
            try {
                Event.EventCategory cat = Event.EventCategory.valueOf(category.toUpperCase());
                events = eventRepo.findByStatusAndCategory(Event.EventStatus.ACTIVE, cat);
            } catch (IllegalArgumentException e) {
                events = eventRepo.findByStatus(Event.EventStatus.ACTIVE);
            }
        } else {
            events = eventRepo.findByStatus(Event.EventStatus.ACTIVE);
        }
        return ResponseEntity.ok(Map.of("success", true, "data", events.stream().map(this::toMap).collect(Collectors.toList())));
    }

    // ─── GET single event (public) ───────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        return eventRepo.findById(id)
            .map(e -> ResponseEntity.ok(Map.of("success", true, "data", toMap(e))))
            .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET events by admin ─────────────────────────────────
    @GetMapping("/my-events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getMyEvents(HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");
        List<Map<String,Object>> list = eventRepo.findByCreatedById(adminId)
            .stream().map(this::toMap).collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    // ─── CREATE event ────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> body, HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");
        var admin = adminRepo.findById(adminId).orElseThrow();

        Event event = Event.builder()
            .title((String) body.get("title"))
            .description((String) body.get("description"))
            .category(Event.EventCategory.valueOf(((String) body.get("category")).toUpperCase()))
            .location((String) body.get("location"))
            .college(admin.getCollege())
            .startDate(LocalDate.parse((String) body.get("startDate")))
            .endDate(LocalDate.parse((String) body.get("endDate")))
            .fee(new BigDecimal(body.get("fee").toString()))
            .totalSlots(Integer.parseInt(body.get("totalSlots").toString()))
            .status(body.get("status") != null
                ? Event.EventStatus.valueOf(((String) body.get("status")).toUpperCase())
                : Event.EventStatus.ACTIVE)
            .createdBy(admin)
            .build();

        eventRepo.save(event);
        return ResponseEntity.ok(Map.of("success", true, "message", "Event created successfully", "data", toMap(event)));
    }

    // ─── UPDATE event ────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateEvent(@PathVariable Long id,
                                         @RequestBody Map<String, Object> body,
                                         HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");
        var event = eventRepo.findById(id).orElseThrow();

        if (!event.getCreatedBy().getId().equals(adminId))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));

        if (body.containsKey("title"))       event.setTitle((String) body.get("title"));
        if (body.containsKey("description")) event.setDescription((String) body.get("description"));
        if (body.containsKey("category"))    event.setCategory(Event.EventCategory.valueOf(((String) body.get("category")).toUpperCase()));
        if (body.containsKey("location"))    event.setLocation((String) body.get("location"));
        if (body.containsKey("startDate"))   event.setStartDate(LocalDate.parse((String) body.get("startDate")));
        if (body.containsKey("endDate"))     event.setEndDate(LocalDate.parse((String) body.get("endDate")));
        if (body.containsKey("fee"))         event.setFee(new BigDecimal(body.get("fee").toString()));
        if (body.containsKey("totalSlots"))  event.setTotalSlots(Integer.parseInt(body.get("totalSlots").toString()));
        if (body.containsKey("status"))      event.setStatus(Event.EventStatus.valueOf(((String) body.get("status")).toUpperCase()));

        eventRepo.save(event);
        return ResponseEntity.ok(Map.of("success", true, "message", "Event updated", "data", toMap(event)));
    }

    // ─── DELETE event ────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, HttpServletRequest req) {
        Long adminId = (Long) req.getAttribute("userId");
        var event = eventRepo.findById(id).orElseThrow();

        if (!event.getCreatedBy().getId().equals(adminId))
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));

        eventRepo.delete(event);
        return ResponseEntity.ok(Map.of("success", true, "message", "Event deleted"));
    }

    // ─── Helper ──────────────────────────────────────────────
    private Map<String, Object> toMap(Event e) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",           e.getId());
        m.put("title",        e.getTitle());
        m.put("description",  e.getDescription());
        m.put("category",     e.getCategory().name());
        m.put("location",     e.getLocation());
        m.put("college",      e.getCollege());
        m.put("startDate",    e.getStartDate().toString());
        m.put("endDate",      e.getEndDate().toString());
        m.put("fee",          e.getFee());
        m.put("totalSlots",   e.getTotalSlots());
        m.put("filledSlots",  e.getFilledSlots());
        m.put("status",       e.getStatus().name());
        m.put("createdById",  e.getCreatedBy().getId());
        m.put("createdAt",    e.getCreatedAt().toString());
        return m;
    }
}
