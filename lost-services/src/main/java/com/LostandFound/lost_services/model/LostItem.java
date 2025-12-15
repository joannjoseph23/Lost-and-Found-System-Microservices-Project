package com.LostandFound.lost_services.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
public class LostItem {

    @Id
    private String id = UUID.randomUUID().toString();

    private String username;   // who submitted it

    @Column(length = 1000)
    private String description;

    private String location;

    private String status = "OPEN"; // OPEN / MATCHED

    private Instant createdAt = Instant.now();

    // getters & setters
    public String getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
}
