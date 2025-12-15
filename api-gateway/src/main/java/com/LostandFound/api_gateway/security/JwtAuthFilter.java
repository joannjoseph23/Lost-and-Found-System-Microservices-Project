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

        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod() == null
                ? ""
                : exchange.getRequest().getMethod().name();

        // -------- PUBLIC ROUTES --------
        if (path.startsWith("/auth")) {
            return chain.filter(exchange);
        }

        if (path.startsWith("/found") && "GET".equals(method)) {
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

            String role = claims.get("role", String.class);
            String tokenUsername = claims.getSubject(); // JWT "sub"

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
            if (path.startsWith("/match")) {

                // USER: can ONLY access their own matches
                if ("GET".equals(method)
                        && path.startsWith("/match/matches/by-user/")) {

                    if (!"USER".equals(role)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    String requestedUsername =
                            path.substring("/match/matches/by-user/".length());

                    // safety cleanup
                    if (requestedUsername.contains("/")) {
                        requestedUsername =
                                requestedUsername.substring(0, requestedUsername.indexOf("/"));
                    }

                    if (!requestedUsername.equals(tokenUsername)) {
                        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                        return exchange.getResponse().setComplete();
                    }

                    return chain.filter(exchange);
                }

                // ADMIN: everything else under /match
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
