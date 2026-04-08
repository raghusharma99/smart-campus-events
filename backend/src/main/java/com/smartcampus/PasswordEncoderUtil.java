package com.smartcampus;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


public class PasswordEncoderUtil {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // ── CHANGE THESE PASSWORDS TO WHATEVER YOU WANT ──────
        String[] passwords = {
            "password"

        };
        // ─────────────────────────────────────────────────────

        System.out.println("══════════════════════════════════════════════");
        System.out.println("  BCrypt Password Hashes — Copy & use in SQL  ");
        System.out.println("══════════════════════════════════════════════");

        for (String password : passwords) {
            String hash = encoder.encode(password);
            System.out.println();
            System.out.println("Password : " + password);
            System.out.println("BCrypt   : " + hash);
            System.out.println("SQL      : '" + hash + "'");
        }

        System.out.println();
        System.out.println("══════════════════════════════════════════════");
        System.out.println("Verification test:");
        for (String password : passwords) {
            String hash = encoder.encode(password);
            boolean ok = encoder.matches(password, hash);
            System.out.println(password + " → " + (ok ? "✅ VALID" : "❌ INVALID"));
        }
    }
}
