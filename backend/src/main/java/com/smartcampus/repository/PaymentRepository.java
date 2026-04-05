package com.smartcampus.repository;

import com.smartcampus.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByStudentId(Long studentId);

    List<Payment> findByEventId(Long eventId);

    Optional<Payment> findByTransactionId(String transactionId);

    @Query("SELECT SUM(p.amount) FROM Payment p " +
           "JOIN p.event e WHERE e.createdBy.id = :adminId " +
           "AND p.status = 'SUCCESS'")
    Double sumRevenueByAdminId(@Param("adminId") Long adminId);
}
