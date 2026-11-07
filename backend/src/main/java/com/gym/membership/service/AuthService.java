package com.gym.membership.service;

import com.gym.membership.dto.RegisterRequest;
import com.gym.membership.entity.Role;
import com.gym.membership.entity.User;
import com.gym.membership.repository.UserRepository;
import com.gym.membership.security.JwtUtil;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public Map<String, String> register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DataIntegrityViolationException("Email already in use");
        }

        Role assignedRole = Role.fromString(request.getRole(), normalizedEmail);

        User newUser = new User();
        newUser.setEmail(normalizedEmail);
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setRole(assignedRole);

        User savedUser = userRepository.saveAndFlush(newUser);
        String authority = savedUser.getRole().toAuthority();
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), authority);

        return Map.of(
                "token", token,
                "email", savedUser.getEmail(),
                "role", authority
        );
    }

    @Transactional(readOnly = true)
    public Map<String, String> login(String email, String password) {
        String normalizedEmail = email.trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid credentials. Please check your email and password.");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials. Please check your email and password.");
        }

        String authority = user.getRole().toAuthority();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), authority);

        return Map.of(
                "token", token,
                "email", user.getEmail(),
                "role", authority
        );
    }
}
