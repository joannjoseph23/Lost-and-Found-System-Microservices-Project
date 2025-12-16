package com.LostandFound.found_services.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import com.LostandFound.found_services.model.FoundItem;
import com.LostandFound.found_services.repo.FoundItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

@WebMvcTest(FoundItemController.class)
class FoundItemControllerTest {

    @Autowired MockMvc mvc;

    @MockBean FoundItemRepository repo;

    @Test
    void health_returnsOk() throws Exception {
        mvc.perform(get("/found-items/health"))
           .andExpect(status().isOk())
           .andExpect(content().string("OK"));
    }

    @Test
    void list_returnsArray() throws Exception {
        FoundItem a = new FoundItem();
        a.setId("1");
        a.setTitle("Wallet");
        a.setStatus("AVAILABLE");

        when(repo.findAll()).thenReturn(List.of(a));

        mvc.perform(get("/found-items"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$[0].id").value("1"))
           .andExpect(jsonPath("$[0].title").value("Wallet"))
           .andExpect(jsonPath("$[0].status").value("AVAILABLE"));
    }
}
