package com.gym.membership.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @GetMapping("/plans")
    public ResponseEntity<List<Map<String, Object>>> getPublicPricingPlans() {
        List<Map<String, Object>> plans = List.of(
                Map.of(
                        "id", "pulse-starter",
                        "name", "Iron Starter",
                        "price", "₹999",
                        "period", "/month",
                        "badge", "Essential",
                        "popular", false,
                        "description", "Full strength & cardio floor access designed for self-driven lifters.",
                        "features", List.of(
                                "Unlimited gym floor & free-weights access",
                                "Olympic lifting & power racks",
                                "Standard locker room & shower access",
                                "1 Initial InBody biometric scan"
                        )
                ),
                Map.of(
                        "id", "pulse-pro",
                        "name", "Pro Transformation",
                        "price", "₹1,999",
                        "period", "/month",
                        "badge", "Most Popular",
                        "popular", true,
                        "description", "Our signature functional training, HIIT turf classes, and strength coaching.",
                        "features", List.of(
                                "24/7 Unlimited access to all training zones",
                                "Unlimited Group HIIT, CrossFit & Boxing sessions",
                                "4 Personal Trainer assessment sessions / month",
                                "Monthly InBody 770 composition tracking",
                                "Custom macro & nutrition blueprint"
                        )
                ),
                Map.of(
                        "id", "pulse-elite",
                        "name", "Apex Athlete",
                        "price", "₹3,499",
                        "period", "/month",
                        "badge", "All-Inclusive",
                        "popular", false,
                        "description", "Dedicated 1-on-1 transformation coaching with full recovery suite access.",
                        "features", List.of(
                                "Everything in Pro Transformation",
                                "12 Dedicated 1-on-1 Personal Training sessions / month",
                                "Infrared sauna & cold-plunge recovery lounge",
                                "Priority guest passes (4 per month)",
                                "Weekly accountability check-ins with Head Coach"
                        )
                )
        );
        return ResponseEntity.ok(plans);
    }

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> submitContactInquiry(@RequestBody Map<String, String> payload) {
        String name = payload.getOrDefault("name", "").trim();
        String phone = payload.getOrDefault("phone", "").trim();
        String goal = payload.getOrDefault("goal", "General Fitness").trim();

        if (name.isEmpty() || phone.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Please provide your name and phone number."));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "status", "RECEIVED",
                        "message", "Thanks " + name + "! Your free trial pass for " + goal + " is reserved.",
                        "timestamp", LocalDateTime.now().toString()
                ));
    }
}
