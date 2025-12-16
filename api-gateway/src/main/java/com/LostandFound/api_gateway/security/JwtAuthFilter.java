package com.LostandFound.api_gateway.security;

import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthFilter implements GlobalFilter {

    private static final String SECRET =
            "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32+_CHARS";

    private final SecretKey key =
            Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        // ✅ Better path handling (important with StripPrefix)
        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod() == null
                ? ""
                : exchange.getRequest().getMethod().name();

        // debug logging
        System.out.println("[GW] " + method + " " + path);

        // ✅ Allow browser preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return chain.filter(exchange);
        }

        // -------- PUBLIC ROUTES --------

        // auth service
        if (path.startsWith("/auth")) {
            return chain.filter(exchange);
        }

        // found items (GET only)
        if (path.startsWith("/found") && "GET".equals(method)) {
            return chain.filter(exchange);
        }

        // public images
        if (path.startsWith("/uploads") && "GET".equals(method)) {
            return chain.filter(exchange);
        }

        // ✅ test-service public endpoints (works with StripPrefix=1 too)
        if (path.equals("/ping") || path.equals("/health")
                || path.startsWith("/test/ping") || path.startsWith("/test/health")) {
            return chain.filter(exchange);
        }

        // -------- AUTH REQUIRED --------
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        try {
            String token = authHeader.substring(7);

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println("JWT CLAIMS = " + claims);

            String role = claims.get("role", String.class);
            String jwtUsername = claims.getSubject(); // sub = username

            // -------- FOUND --------
            if (path.startsWith("/found")
                    && ("POST".equals(method)
                    || "PUT".equals(method)
                    || "DELETE".equals(method))) {

                if (!"ADMIN".equals(role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }

            // -------- LOST --------
            if (path.startsWith("/lost")) {
                if ("POST".equals(method)) {
                    if (!"USER".equals(role)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                } else {
                    if (!"ADMIN".equals(role)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                }
            }

            // -------- MATCH --------
            if (path.startsWith("/matches")) {

                // USER fetching their own matches
                if ("GET".equals(method) && path.startsWith("/matches/by-user/")) {

                    if (!"USER".equals(role) && !"ADMIN".equals(role)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    String requestedUsername =
                            path.substring("/matches/by-user/".length());

                    int slash = requestedUsername.indexOf("/");
                    if (slash >= 0) {
                        requestedUsername = requestedUsername.substring(0, slash);
                    }

                    int qmark = requestedUsername.indexOf("?");
                    if (qmark >= 0) {
                        requestedUsername = requestedUsername.substring(0, qmark);
                    }

                    System.out.println("[GW MATCH] requested=" + requestedUsername
                            + " jwt=" + jwtUsername + " role=" + role);

                    // ADMIN can view all, USER only self
                    if (!"ADMIN".equals(role) && !requestedUsername.equals(jwtUsername)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    return chain.filter(exchange);
                }

                // everything else under /matches → ADMIN only
                if (!"ADMIN".equals(role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }

            // -------- TEST (secure endpoint) --------
            // /test/secure automatically reaches here → token required
            return chain.filter(exchange);

        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
