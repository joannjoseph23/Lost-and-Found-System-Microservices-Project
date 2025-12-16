package com.LostandFound.matching_service.controller;

import com.LostandFound.matching_service.model.MatchResult;
import com.LostandFound.matching_service.repo.MatchResultRepository;
import com.LostandFound.matching_service.service.MatchingJob;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MatchController.class)
class MatchControllerTest {

    @Autowired MockMvc mvc;

    @MockBean MatchingJob job;
    @MockBean MatchResultRepository repo;

    @Test
    void all_shouldReturnList() throws Exception {
        MatchResult m = new MatchResult();
        m.setLostItemId("lost1");
        m.setFoundItemId("found1");
        m.setLostUsername("user1");
        m.setScore(3.0);
        m.setReason("Common keywords: wallet, black, id");

        when(repo.findAll()).thenReturn(List.of(m));

        mvc.perform(get("/matches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lostItemId").value("lost1"))
                .andExpect(jsonPath("$[0].foundItemId").value("found1"))
                .andExpect(jsonPath("$[0].lostUsername").value("user1"))
                .andExpect(jsonPath("$[0].score").value(3.0))
                .andExpect(jsonPath("$[0].reason").value("Common keywords: wallet, black, id"));
    }
}
