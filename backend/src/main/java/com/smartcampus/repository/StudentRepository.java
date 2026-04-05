package com.smartcampus.repository;

import com.smartcampus.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByEmail(String email);
    Optional<Student> findByMobile(String mobile);
    Optional<Student> findByEmailOrMobile(String email, String mobile);

    boolean existsByEmail(String email);
    boolean existsByMobile(String mobile);
    boolean existsByEnrollmentNo(String enrollmentNo);
    boolean existsByRollNo(String rollNo);
}
