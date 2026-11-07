package com.gym.membership.repository;

import com.gym.membership.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByEventId(String eventId);
    boolean existsByEventId(String eventId);
}
