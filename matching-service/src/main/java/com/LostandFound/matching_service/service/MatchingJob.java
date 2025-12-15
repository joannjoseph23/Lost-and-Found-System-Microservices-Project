package com.LostandFound.matching_service.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.LostandFound.matching_service.client.FoundClient;
import com.LostandFound.matching_service.client.LostClient;
import com.LostandFound.matching_service.model.MatchResult;
import com.LostandFound.matching_service.repo.MatchResultRepository;

@Service
public class MatchingJob {

    private final FoundClient foundClient;
    private final LostClient lostClient;
    private final MatchResultRepository repo;

    public MatchingJob(FoundClient foundClient, LostClient lostClient, MatchResultRepository repo) {
        this.foundClient = foundClient;
        this.lostClient = lostClient;
        this.repo = repo;
    }

    // run every 60 seconds (fixedDelay avoids overlap if a run takes long)
    @Scheduled(fixedDelay = 60000)
    public void runMatching() {
        runOnce();
    }

    public List<MatchResult> runOnce() {
        List<Map<String, Object>> found = foundClient.getFoundItems();
        List<Map<String, Object>> lost = lostClient.getLostItems();

        List<MatchResult> newlyCreated = new ArrayList<>();

        for (Map<String, Object> l : lost) {
            String lostId = String.valueOf(l.get("id"));

            // ✅ NEW: extract username from lost item
            String lostUsername = String.valueOf(l.getOrDefault("username", ""));

            String desc = String.valueOf(l.getOrDefault("description", ""));
            String loc = String.valueOf(l.getOrDefault("location", ""));
            Set<String> lostWords = tokenize(desc + " " + loc);

            for (Map<String, Object> f : found) {
                String foundId = String.valueOf(f.get("id"));

                // ✅ dedup (prevents infinite insert spam)
                if (repo.existsByLostItemIdAndFoundItemId(lostId, foundId)) {
                    continue;
                }

                Set<String> foundWords = new HashSet<>();

                Object kwsObj = f.get("keywords");
                if (kwsObj instanceof List<?>) {
                    for (Object o : (List<?>) kwsObj) {
                        foundWords.add(String.valueOf(o).toLowerCase());
                    }
                } else {
                    foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("title", ""))));
                    foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("description", ""))));
                    foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("location", ""))));
                }

                Set<String> common = new HashSet<>(lostWords);
                common.retainAll(foundWords);

                double score = common.size();

                if (score >= 2) {
                    List<String> sortedCommon = common.stream().sorted().toList();

                    MatchResult mr = new MatchResult();
                    mr.setLostItemId(lostId);
                    mr.setFoundItemId(foundId);
                    mr.setLostUsername(lostUsername); // ✅ NEW
                    mr.setScore(score);
                    mr.setReason("Common keywords: " + String.join(", ", sortedCommon));

                    newlyCreated.add(repo.save(mr));
                }
            }
        }

        return newlyCreated;
    }

    private Set<String> tokenize(String s) {
        if (s == null) return Set.of();
        return Arrays.stream(s.toLowerCase().split("[^a-z0-9]+"))
                .filter(w -> w.length() >= 3)
                .collect(Collectors.toSet());
    }
}
