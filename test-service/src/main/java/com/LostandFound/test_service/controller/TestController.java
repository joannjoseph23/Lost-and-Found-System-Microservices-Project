package com.LostandFound.test_service.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "service", "test-service",
            "status", "ok",
            "time", Instant.now().toString()
        );
    }

    // public demo endpoint
    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of("message", "pong from test-service");
    }

    // protected demo endpoint (gateway should block without token)
    @GetMapping("/secure")
    public Map<String, Object> secure() {
        return Map.of("message", "you are authorized ✅");
    }
}
