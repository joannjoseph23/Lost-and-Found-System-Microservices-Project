package com.LostandFound.matching_service.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.LostandFound.matching_service.model.MatchResult;
import com.LostandFound.matching_service.repo.MatchResultRepository;
import com.LostandFound.matching_service.service.MatchingJob;

@RestController
@RequestMapping("/matches")
public class MatchController {

    private final MatchingJob job;
    private final MatchResultRepository repo;

    public MatchController(MatchingJob job, MatchResultRepository repo) {
        this.job = job;
        this.repo = repo;
    }

    // Create matches now (returns only newly created)
    @PostMapping("/run")
    public List<MatchResult> runNow() {
        return job.runOnce();
    }

    // All matches
    @GetMapping
    public List<MatchResult> all() {
        return repo.findAll();
    }

    // Matches for one lost item (frontend will use this a lot)
    @GetMapping("/by-lost/{lostItemId}")
    public List<MatchResult> byLost(@PathVariable String lostItemId) {
        return repo.findByLostItemIdOrderByScoreDescCreatedAtDesc(lostItemId);
    }

    // Matches by username (no lostIds anymore)
    @GetMapping("/by-user/{username}")
    public List<MatchResult> byUser(@PathVariable String username) {
        return repo.findByLostUsernameOrderByScoreDescCreatedAtDesc(username);
    }
}
