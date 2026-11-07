package com.gym.membership.entity;

public enum Role {
    ROLE_USER,
    ROLE_ADMIN,
    GYM_MEMBER,
    GYM_ADMIN,
    MEMBER,
    USER,
    ADMIN;

    public static Role fromString(String rawRole, String email) {
        if (rawRole != null && !rawRole.isBlank()) {
            String normalized = rawRole.trim().toUpperCase();
            if (normalized.equals("ROLE_ADMIN")
                    || normalized.equals("GYM_ADMIN")
                    || normalized.equals("ADMIN")) {
                return ROLE_ADMIN;
            }
            if (normalized.equals("ROLE_USER")
                    || normalized.equals("GYM_MEMBER")
                    || normalized.equals("MEMBER")
                    || normalized.equals("USER")) {
                return ROLE_USER;
            }
        }
        if (email != null && email.trim().toLowerCase().startsWith("admin@")) {
            return ROLE_ADMIN;
        }
        return ROLE_USER;
    }

    public String toAuthority() {
        if (this == ROLE_ADMIN || this == GYM_ADMIN || this == ADMIN) {
            return "ROLE_ADMIN";
        }
        return "ROLE_USER";
    }
}
