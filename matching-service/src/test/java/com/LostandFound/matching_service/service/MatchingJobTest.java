package com.LostandFound.matching_service.service;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.*;

import java.util.List;
import java.util.Map;

import com.LostandFound.matching_service.client.FoundClient;
import com.LostandFound.matching_service.client.LostClient;
import com.LostandFound.matching_service.model.MatchResult;
import com.LostandFound.matching_service.repo.MatchResultRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class MatchingJobTest {

    @Test
    void runOnce_createsMatch_whenTwoCommonWords() {
        FoundClient foundClient = mock(FoundClient.class);
        LostClient lostClient = mock(LostClient.class);
        MatchResultRepository repo = mock(MatchResultRepository.class);

        MatchingJob job = new MatchingJob(foundClient, lostClient, repo);

        // lost: "black wallet canteen"
        when(lostClient.getLostItems()).thenReturn(List.of(
            Map.of("id", "L1", "username", "user1", "description", "black wallet", "location", "canteen")
        ));

        // found keywords include black + wallet => score >= 2
        when(foundClient.getFoundItems()).thenReturn(List.of(
            Map.of("id", "F1", "keywords", List.of("black", "wallet"))
        ));

        when(repo.existsByLostItemIdAndFoundItemId("L1", "F1")).thenReturn(false);

        // when saving, return the same object
        when(repo.save(any(MatchResult.class))).thenAnswer(inv -> inv.getArgument(0));

        List<MatchResult> created = job.runOnce();

        assertThat(created).hasSize(1);
        assertThat(created.get(0).getLostItemId()).isEqualTo("L1");
        assertThat(created.get(0).getFoundItemId()).isEqualTo("F1");
        assertThat(created.get(0).getLostUsername()).isEqualTo("user1");
        assertThat(created.get(0).getScore()).isGreaterThanOrEqualTo(2.0);

        // optional: verify save called once
        verify(repo, times(1)).save(any(MatchResult.class));
    }

    @Test
    void runOnce_skipsDuplicate_existingMatch() {
        FoundClient foundClient = mock(FoundClient.class);
        LostClient lostClient = mock(LostClient.class);
        MatchResultRepository repo = mock(MatchResultRepository.class);

        MatchingJob job = new MatchingJob(foundClient, lostClient, repo);

        when(lostClient.getLostItems()).thenReturn(List.of(
            Map.of("id", "L1", "username", "user1", "description", "black wallet", "location", "canteen")
        ));
        when(foundClient.getFoundItems()).thenReturn(List.of(
            Map.of("id", "F1", "keywords", List.of("black", "wallet"))
        ));

        when(repo.existsByLostItemIdAndFoundItemId("L1", "F1")).thenReturn(true);

        List<MatchResult> created = job.runOnce();

        assertThat(created).isEmpty();
        verify(repo, never()).save(any());
    }
}
