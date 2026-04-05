package com.smartcampus.repository;

import com.smartcampus.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudentId(Long studentId);

    List<Registration> findByEventId(Long eventId);

    List<Registration> findByEventIdAndStatus(Long eventId, Registration.RegistrationStatus status);

    Optional<Registration> findByStudentIdAndEventId(Long studentId, Long eventId);

    boolean existsByStudentIdAndEventId(Long studentId, Long eventId);

    long countByEventId(Long eventId);

    @Query("SELECT r FROM Registration r JOIN r.event e WHERE e.createdBy.id = :adminId")
    List<Registration> findAllByAdminId(@Param("adminId") Long adminId);

    @Query("SELECT r FROM Registration r JOIN r.event e " +
           "WHERE e.createdBy.id = :adminId AND r.status = :status")
    List<Registration> findByAdminIdAndStatus(
            @Param("adminId") Long adminId,
            @Param("status")  Registration.RegistrationStatus status);
}
