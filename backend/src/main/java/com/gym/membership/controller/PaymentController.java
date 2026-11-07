package com.gym.membership.controller;

import com.gym.membership.entity.Membership;
import com.gym.membership.entity.Payment;
import com.gym.membership.entity.User;
import com.gym.membership.repository.MembershipRepository;
import com.gym.membership.repository.PaymentRepository;
import com.gym.membership.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:rzp_secret_placeholder}")
    private String razorpayKeySecret;

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final PaymentRepository paymentRepository;

    public PaymentController(
            UserRepository userRepository,
            MembershipRepository membershipRepository,
            PaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.paymentRepository = paymentRepository;
    }

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(
            @RequestBody(required = false) Map<String, Object> requestBody
    ) {
        int amountInRupees = 1999;
        if (requestBody != null && requestBody.get("amount") != null) {
            try {
                amountInRupees = Integer.parseInt(requestBody.get("amount").toString());
            } catch (NumberFormatException ignored) {
                amountInRupees = 1999;
            }
        }

        int amountInPaise = amountInRupees * 100;
        String receipt = "txn_" + System.currentTimeMillis();

        try {
            RazorpayClient razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", receipt);

            Order order = razorpayClient.orders.create(orderRequest);
            String orderId = order.get("id");

            log.info("Razorpay Order created successfully: id={}, amount={}", orderId, amountInPaise);

            Map<String, Object> response = new HashMap<>();
            response.put("id", orderId);
            response.put("order_id", orderId);
            response.put("orderId", orderId);
            response.put("amount", amountInPaise);
            response.put("currency", "INR");
            response.put("key", razorpayKeyId);
            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            System.err.println("RazorpayException while creating order: " + e.getMessage());
            e.printStackTrace();
            log.error("RazorpayException while creating order with keyId={}: {}",
                    razorpayKeyId, e.getMessage(), e);

            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "Razorpay Order Creation Failed",
                            "message", "Razorpay error: " + e.getMessage()
                                    + " (Check razorpay.key.id and razorpay.key.secret in application.yml)"
                    ));
        }
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyAndActivateMembership(
            @RequestBody Map<String, Object> payload
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication != null ? authentication.getName() : null;

        String paymentId = payload.getOrDefault("razorpay_payment_id", "pay_" + UUID.randomUUID()).toString();
        String planName = payload.getOrDefault("planName", "Pro Transformation").toString();

        if (email != null) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();

                Payment payment = new Payment();
                payment.setUserId(user.getId());
                payment.setAmount(new BigDecimal("1999.00"));
                payment.setStatus("CAPTURED");
                payment.setRazorpayPaymentId(paymentId);
                payment.setEventId("evt_" + UUID.randomUUID());
                paymentRepository.save(payment);

                Membership membership = membershipRepository
                        .findByUserId(user.getId())
                        .orElseGet(Membership::new);
                membership.setUserId(user.getId());
                membership.setPlanId(planName);
                membership.setStatus("ACTIVE");
                membership.setEndDate(LocalDateTime.now().plusDays(30));
                membershipRepository.save(membership);
            }
        }

        return ResponseEntity.ok(Map.of(
                "status", "ACTIVE",
                "paymentId", paymentId,
                "message", "Membership activated successfully"
        ));
    }
}
