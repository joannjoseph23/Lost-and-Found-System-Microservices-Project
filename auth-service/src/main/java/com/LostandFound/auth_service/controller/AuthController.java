package com.LostandFound.auth_service.controller;

import com.LostandFound.auth_service.model.AppUser;
import com.LostandFound.auth_service.repo.UserRepository;
import com.LostandFound.auth_service.security.JwtUtil;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public record RegisterReq(@NotBlank String username, @NotBlank String password, String role) {}
    public record LoginReq(@NotBlank String username, @NotBlank String password) {}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterReq req) {
        if (users.existsById(req.username())) {
            return ResponseEntity.badRequest().body(Map.of("error", "username already exists"));
        }

        AppUser u = new AppUser();
        u.setUsername(req.username());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setRole((req.role() == null || req.role().isBlank()) ? "USER" : req.role().toUpperCase());

        users.save(u);
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return ResponseEntity.ok(Map.of("token", token, "username", u.getUsername(), "role", u.getRole()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginReq req) {
        AppUser u = users.findById(req.username()).orElse(null);
        if (u == null || !encoder.matches(req.password(), u.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
        }
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return ResponseEntity.ok(Map.of("token", token, "username", u.getUsername(), "role", u.getRole()));
    }
}
