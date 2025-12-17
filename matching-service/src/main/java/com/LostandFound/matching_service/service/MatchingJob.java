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

    // words we do NOT want to count as "keywords"
    private static final Set<String> STOP = Set.of(
            // common English
            "the","and","for","with","from","that","this","was","were","are","been","have","has","had",
            "not","but","you","your","my","our","their","his","her","its","into","over","near","left",
            "in","on","at","to","of","a","an","is","it","as","by","or",

            // domain noise
            "lost","found","item","items","please","contact","mail","admin","user","photo","image",
            "class","row","seat","nearby"
    );

    public MatchingJob(FoundClient foundClient,
                       LostClient lostClient,
                       MatchResultRepository repo) {
        this.foundClient = foundClient;
        this.lostClient = lostClient;
        this.repo = repo;
    }

    // run every 60 seconds (fixedDelay avoids overlap)
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

            // extract username from lost item
            String lostUsername = String.valueOf(l.getOrDefault("username", ""));

            String desc = String.valueOf(l.getOrDefault("description", ""));
            String loc = String.valueOf(l.getOrDefault("location", ""));
            Set<String> lostWords = tokenize(desc + " " + loc);

            for (Map<String, Object> f : found) {
                String foundId = String.valueOf(f.get("id"));

                // prevent duplicate matches
                if (repo.existsByLostItemIdAndFoundItemId(lostId, foundId)) {
                    continue;
                }

                // build found words from text fields + keywords
                Set<String> foundWords = new HashSet<>();

                // include title / description / location
                foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("title", ""))));
                foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("description", ""))));
                foundWords.addAll(tokenize(String.valueOf(f.getOrDefault("location", ""))));

                // include keywords if present
                Object kwsObj = f.get("keywords");
                if (kwsObj instanceof List<?>) {
                    for (Object o : (List<?>) kwsObj) {
                        String kw = String.valueOf(o).toLowerCase().trim();
                        if (!kw.isEmpty() && kw.length() >= 3 && !STOP.contains(kw) && !kw.matches("\\d+")) {
                            foundWords.add(kw);
                        }
                    }
                }

                // compute overlap
                Set<String> common = new HashSet<>(lostWords);
                common.retainAll(foundWords);

                double score = common.size();

                // keep threshold = 2
                if (score >= 2) {
                    List<String> sortedCommon = common.stream()
                            .sorted()
                            .toList();

                    MatchResult mr = new MatchResult();
                    mr.setLostItemId(lostId);
                    mr.setFoundItemId(foundId);
                    mr.setLostUsername(lostUsername);
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
                .filter(w -> !STOP.contains(w))
                .filter(w -> !w.matches("\\d+")) // ignore pure numbers like 201
                .collect(Collectors.toSet());
    }
}
