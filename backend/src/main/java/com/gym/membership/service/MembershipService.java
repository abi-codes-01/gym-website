package com.gym.membership.service;

import com.gym.membership.entity.Membership;
import com.gym.membership.entity.User;
import com.gym.membership.repository.MembershipRepository;
import com.gym.membership.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MembershipService {

    private static final Logger log = LoggerFactory.getLogger(MembershipService.class);

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final RazorpayClient razorpayClient;

    public MembershipService(
            UserRepository userRepository,
            MembershipRepository membershipRepository,
            RazorpayClient razorpayClient
    ) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.razorpayClient = razorpayClient;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMembershipStatus(String email) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            response.put("status", "INACTIVE");
            response.put("endDate", null);
            return response;
        }

        User user = userOpt.get();
        Optional<Membership> membershipOpt = membershipRepository.findByUserId(user.getId());

        if (membershipOpt.isPresent()) {
            Membership membership = membershipOpt.get();
            boolean isActive = "ACTIVE".equalsIgnoreCase(membership.getStatus())
                    && membership.getEndDate() != null
                    && membership.getEndDate().isAfter(LocalDateTime.now());

            response.put("status", isActive ? "ACTIVE" : "INACTIVE");
            response.put("endDate", membership.getEndDate());
        } else {
            response.put("status", "INACTIVE");
            response.put("endDate", null);
        }

        return response;
    }

    public String createPremiumOrder(String email) throws RazorpayException {
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", 199900); // ₹1999 in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

        if (email != null && !email.isBlank()) {
            JSONObject notes = new JSONObject();
            notes.put("email", email);
            orderRequest.put("notes", notes);
        }

        Order order = razorpayClient.orders.create(orderRequest);
        String orderId = order.get("id");
        log.info("Created Razorpay order via MembershipService: id={}", orderId);
        return orderId;
    }
}
