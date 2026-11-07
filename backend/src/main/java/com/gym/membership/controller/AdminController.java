package com.gym.membership.controller;

import com.gym.membership.entity.Membership;
import com.gym.membership.entity.Payment;
import com.gym.membership.entity.Role;
import com.gym.membership.entity.User;
import com.gym.membership.repository.MembershipRepository;
import com.gym.membership.repository.PaymentRepository;
import com.gym.membership.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final PaymentRepository paymentRepository;

    public AdminController(
            UserRepository userRepository,
            MembershipRepository membershipRepository,
            PaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboardStats() {
        List<User> allUsers = userRepository.findAll();
        List<Membership> allMemberships = membershipRepository.findAll();
        List<Payment> allPayments = paymentRepository.findAll();

        long activeMembersCount = allMemberships.stream()
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus())
                        && m.getEndDate() != null
                        && m.getEndDate().isAfter(LocalDateTime.now()))
                .count();

        BigDecimal totalRevenue = allPayments.stream()
                .filter(p -> "CAPTURED".equalsIgnoreCase(p.getStatus()) || "SUCCESS".equalsIgnoreCase(p.getStatus()))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Map<String, Object>> userRows = allUsers.stream().map(user -> {
            Optional<Membership> membershipOpt = membershipRepository.findByUserId(user.getId());
            String membershipStatus = membershipOpt
                    .map(Membership::getStatus)
                    .orElse("INACTIVE");
            String planId = membershipOpt
                    .map(Membership::getPlanId)
                    .orElse("Free Tier");

            Map<String, Object> row = new HashMap<>();
            row.put("id", user.getId().toString());
            row.put("email", user.getEmail());
            row.put("role", user.getRole() != null ? user.getRole().toAuthority() : Role.ROLE_USER.toAuthority());
            row.put("membershipStatus", membershipStatus);
            row.put("planId", planId);
            return row;
        }).collect(Collectors.toList());

        List<Map<String, Object>> recentTransactions = allPayments.stream()
                .limit(10)
                .map(payment -> {
                    Map<String, Object> tx = new HashMap<>();
                    tx.put("id", payment.getId().toString());
                    tx.put("razorpayPaymentId", payment.getRazorpayPaymentId());
                    tx.put("amount", payment.getAmount());
                    tx.put("status", payment.getStatus());
                    tx.put("eventId", payment.getEventId());
                    return tx;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("totalRegisteredUsers", allUsers.size());
        response.put("totalActiveMembers", activeMembersCount);
        response.put("totalRevenue", totalRevenue);
        response.put("users", userRows);
        response.put("recentTransactions", recentTransactions);

        return ResponseEntity.ok(response);
    }
}
