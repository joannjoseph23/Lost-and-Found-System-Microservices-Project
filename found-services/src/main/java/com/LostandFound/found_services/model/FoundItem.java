package com.LostandFound.found_services.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name = "found_items")
public class FoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;
    private String location;

    @Column(length = 2000)
    private String description;

    private String imagePath; // local file path or served URL

    private String status; // AVAILABLE / CLAIMED / RETURNED

    // ✅ NEW: store keywords in DB
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "found_item_keywords",
            joinColumns = @JoinColumn(name = "found_item_id")
    )
    @Column(name = "keyword")
    private List<String> keywords = new ArrayList<>();

    private Instant createdAt = Instant.now();

    public FoundItem() {}

    // getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
