package com.smartcampus.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration.
 *
 * FIX: JwtAuthFilter is now a proper @Component class (JwtAuthFilter.java),
 * injected here directly. Previously it was an anonymous inner class inside
 * a @Bean method, which caused:
 *   IllegalStateException: Failed to introspect Class [SecurityConfig]
 *   ClassNotFoundException: com.smartcampus.config.SecurityConfig$1
 * because Spring DevTools RestartClassLoader cannot reload anonymous classes.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Injected as a proper @Component — replaces anonymous inner class
    private final JwtAuthFilter jwtAuthFilter;

    /* ── Password encoder ───────────────────────── */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /* ── Security filter chain ──────────────────── */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm ->
                    sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public — no token needed
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/events", "/events/**").permitAll()
                // Student only
                .requestMatchers("/student/**").hasRole("STUDENT")
                .requestMatchers("/feedback/**").hasRole("STUDENT")
                .requestMatchers("/payments/**").hasRole("STUDENT")
                // Student + Admin
                .requestMatchers("/registrations/**").hasAnyRole("STUDENT", "ADMIN")
                // Admin only
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/events/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/events/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /* ── CORS ── */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
