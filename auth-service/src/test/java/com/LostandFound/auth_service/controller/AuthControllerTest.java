package com.LostandFound.auth_service.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.LostandFound.auth_service.model.AppUser;
import com.LostandFound.auth_service.repo.UserRepository;
import com.LostandFound.auth_service.security.JwtUtil;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired MockMvc mvc;

    @MockBean UserRepository users;
    @MockBean PasswordEncoder encoder;
    @MockBean JwtUtil jwt;

    @Test
    void register_shouldCreateUser_andReturnToken() throws Exception {
        when(users.existsById("testuser")).thenReturn(false);
        when(encoder.encode("pass123")).thenReturn("HASHED");
        when(jwt.createToken("testuser", "USER")).thenReturn("TOKEN123");

        mvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"testuser","password":"pass123","role":"USER"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("TOKEN123"))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.role").value("USER"));

        verify(users).save(any(AppUser.class));
    }

    @Test
    void login_shouldReturnToken_whenCredentialsCorrect() throws Exception {
        AppUser u = new AppUser();
        u.setUsername("loginuser");
        u.setPasswordHash("HASHED");
        u.setRole("USER");

        when(users.findById("loginuser")).thenReturn(Optional.of(u));
        when(encoder.matches("pass123", "HASHED")).thenReturn(true);
        when(jwt.createToken("loginuser", "USER")).thenReturn("TOKEN456");

        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"loginuser","password":"pass123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("TOKEN456"))
                .andExpect(jsonPath("$.username").value("loginuser"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void login_shouldReturn401_whenWrongPassword() throws Exception {
        AppUser u = new AppUser();
        u.setUsername("badpass");
        u.setPasswordHash("HASHED");
        u.setRole("USER");

        when(users.findById("badpass")).thenReturn(Optional.of(u));
        when(encoder.matches("wrong", "HASHED")).thenReturn(false);

        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"badpass","password":"wrong"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid credentials"));
    }
}
