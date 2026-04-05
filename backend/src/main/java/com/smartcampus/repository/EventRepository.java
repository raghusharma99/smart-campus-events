package com.smartcampus.repository;

import com.smartcampus.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatus(Event.EventStatus status);

    List<Event> findByCreatedById(Long adminId);

    List<Event> findByCategory(Event.EventCategory category);

    List<Event> findByStatusAndCategory(Event.EventStatus status, Event.EventCategory category);

    @Query("SELECT e FROM Event e WHERE e.status = 'ACTIVE' AND " +
           "(LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(e.college) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Event> searchActiveEvents(@Param("keyword") String keyword);
}
