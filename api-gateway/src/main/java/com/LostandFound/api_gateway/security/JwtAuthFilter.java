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

    // IMPORTANT: must match auth-service secret
    private static final String SECRET =
            "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32+_CHARS";

    private final SecretKey key =
            Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {

        String path = exchange.getRequest().getPath().value();
        String method = exchange.getRequest().getMethod() == null
                ? ""
                : exchange.getRequest().getMethod().name();

        System.out.println("[GW] " + method + " " + path);

        // Allow browser preflight
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return chain.filter(exchange);
        }

        // ---------------- PUBLIC ----------------

        // Auth endpoints
        if (path.startsWith("/auth")) {
            return chain.filter(exchange);
        }

        // Found items GET is public
        if ((path.startsWith("/found") || path.startsWith("/found-items")) && "GET".equals(method)) {
            return chain.filter(exchange);
        }

        // Found images public
        if (path.startsWith("/uploads") && "GET".equals(method)) {
            return chain.filter(exchange);
        }

        // Lost images public
        if (path.startsWith("/lost-uploads") && "GET".equals(method)) {
            return chain.filter(exchange);
        }

        // ---------------- AUTH REQUIRED ----------------
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

            // ---------------- FOUND (admin write) ----------------
            if ((path.startsWith("/found") || path.startsWith("/found-items"))
                    && ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method))) {

                if (!"ADMIN".equals(role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }

            // ---------------- LOST ----------------
            // After StripPrefix=1, /lost/** becomes /lost-items/** (and /lost-uploads/** stays /lost-uploads/**)
            boolean isLostApi = path.startsWith("/lost") || path.startsWith("/lost-items");

            if (isLostApi) {
                // USER is allowed to:
                // - POST /lost-items (create)
                // - GET /lost-items/user/{username} (read own list)
                // ADMIN can do everything
                if ("ADMIN".equals(role)) {
                    return chain.filter(exchange);
                }

                // USER rules
                if (!"USER".equals(role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }

                // allow POST create
                if ("POST".equals(method) && (path.equals("/lost-items") || path.equals("/lost/lost-items"))) {
                    return chain.filter(exchange);
                }

                // allow GET list-by-user ONLY for self
                if ("GET".equals(method) && path.startsWith("/lost-items/user/")) {
                    String requested = path.substring("/lost-items/user/".length());
                    int slash = requested.indexOf("/");
                    if (slash >= 0) requested = requested.substring(0, slash);
                    int qmark = requested.indexOf("?");
                    if (qmark >= 0) requested = requested.substring(0, qmark);

                    if (!requested.equals(jwtUsername)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }
                    return chain.filter(exchange);
                }

                // Everything else in lost-api for USER is blocked (ex: GET /lost-items/{id})
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }

            // ---------------- MATCH ----------------
            // After StripPrefix=1, /match/** becomes /matches/**
            if (path.startsWith("/matches")) {

                // USER can fetch their own matches
                if ("GET".equals(method) && path.startsWith("/matches/by-user/")) {

                    if (!"USER".equals(role) && !"ADMIN".equals(role)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    String requested = path.substring("/matches/by-user/".length());
                    int slash = requested.indexOf("/");
                    if (slash >= 0) requested = requested.substring(0, slash);
                    int qmark = requested.indexOf("?");
                    if (qmark >= 0) requested = requested.substring(0, qmark);

                    // ADMIN can view all, USER only self
                    if (!"ADMIN".equals(role) && !requested.equals(jwtUsername)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    return chain.filter(exchange);
                }

                // All other /matches/** → ADMIN only
                if (!"ADMIN".equals(role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }
            }

            return chain.filter(exchange);

        } catch (JwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
