package com.LostandFound.auth_service.controller;

import com.LostandFound.auth_service.model.AppUser;
import com.LostandFound.auth_service.repo.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired MockMvc mvc;
    @Autowired UserRepository users;

    @BeforeEach
    void cleanDb() {
        users.deleteAll();
    }

    @Test
    void register_shouldCreateUser_andReturnToken() throws Exception {
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"testuser","password":"pass123","role":"USER"}
                        """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token", not(isEmptyOrNullString())))
            .andExpect(jsonPath("$.username").value("testuser"))
            .andExpect(jsonPath("$.role").value("USER"));

        // also verify it actually stored
        AppUser u = users.findById("testuser").orElseThrow();
        // password should be hashed, not raw
        org.junit.jupiter.api.Assertions.assertNotEquals("pass123", u.getPasswordHash());
    }

    @Test
    void login_shouldReturnToken_whenCredentialsCorrect() throws Exception {
        // First register
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"loginuser","password":"pass123","role":"USER"}
                        """))
            .andExpect(status().isOk());

        // Then login
        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"loginuser","password":"pass123"}
                        """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token", not(isEmptyOrNullString())))
            .andExpect(jsonPath("$.username").value("loginuser"))
            .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void login_shouldReturn401_whenWrongPassword() throws Exception {
        mvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"badpass","password":"pass123","role":"USER"}
                        """))
            .andExpect(status().isOk());

        mvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username":"badpass","password":"wrong"}
                        """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("invalid credentials"));
    }
}
