package com.LostandFound.matching_service.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LostandFound.matching_service.model.MatchResult;

public interface MatchResultRepository extends JpaRepository<MatchResult, String> {

    boolean existsByLostItemIdAndFoundItemId(String lostItemId, String foundItemId);

    List<MatchResult> findByLostItemIdOrderByScoreDescCreatedAtDesc(String lostItemId);

    List<MatchResult> findByLostItemIdInOrderByScoreDescCreatedAtDesc(List<String> lostItemIds);

    // ✅ NEW: fetch matches by username
    List<MatchResult> findByLostUsernameOrderByScoreDescCreatedAtDesc(String lostUsername);
}
