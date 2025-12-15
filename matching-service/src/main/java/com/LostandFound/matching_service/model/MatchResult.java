package com.LostandFound.matching_service.model;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "match_result",
        uniqueConstraints = @UniqueConstraint(columnNames = {"lost_item_id", "found_item_id"})
)
public class MatchResult {

    @Id
    private String id;

    @Column(name = "lost_item_id", nullable = false)
    private String lostItemId;

    @Column(name = "found_item_id", nullable = false)
    private String foundItemId;

    @Column(name = "lost_username", nullable = false)
    private String lostUsername;

    private double score;

    @Column(length = 1000)
    private String reason;

    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public String getLostItemId() {
        return lostItemId;
    }

    public void setLostItemId(String lostItemId) {
        this.lostItemId = lostItemId;
    }

    public String getFoundItemId() {
        return foundItemId;
    }

    public void setFoundItemId(String foundItemId) {
        this.foundItemId = foundItemId;
    }

    public String getLostUsername() {
        return lostUsername;
    }

    public void setLostUsername(String lostUsername) {
        this.lostUsername = lostUsername;
    }

    public double getScore() {
        return score;
    }

    public void setScore(double score) {
        this.score = score;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
