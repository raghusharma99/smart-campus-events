package com.smartcampus.repository;

import com.smartcampus.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmail(String email);
    Optional<Admin> findByContact(String contact);
    Optional<Admin> findByEmailOrContact(String email, String contact);

    boolean existsByEmail(String email);
    boolean existsByContact(String contact);
}
