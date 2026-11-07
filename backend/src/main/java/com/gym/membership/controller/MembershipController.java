package com.gym.membership.controller;

import com.gym.membership.service.MembershipService;
import com.razorpay.RazorpayException;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/member", "/api/memberships"})
public class MembershipController {

    private static final Logger log = LoggerFactory.getLogger(MembershipController.class);

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMembershipStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        Map<String, Object> status = membershipService.getMembershipStatus(email);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, String>> createOrder() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        try {
            String orderId = membershipService.createPremiumOrder(email);
            return ResponseEntity.ok(Map.of(
                    "id", orderId,
                    "order_id", orderId,
                    "orderId", orderId
            ));
        } catch (RazorpayException ex) {
            System.err.println("RazorpayException in MembershipController: " + ex.getMessage());
            ex.printStackTrace();
            log.error("Failed to create Razorpay order for {}: {}", email, ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "Failed to create Razorpay order",
                            "message", ex.getMessage() != null ? ex.getMessage() : "Unknown Razorpay error"
                    ));
        }
    }

    @GetMapping("/qr")
    public ResponseEntity<Map<String, String>> getMemberQrCode() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return ResponseEntity.ok(Map.of(
                "email", email,
                "qrPayload", "PULSEFIT-PASS:" + email,
                "zoneAccess", "ALL_ZONES_24_7"
        ));
    }
}
