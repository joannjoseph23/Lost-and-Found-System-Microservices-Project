package com.LostandFound.lost_services.controller;

import com.LostandFound.lost_services.model.LostItem;
import com.LostandFound.lost_services.repo.LostItemRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/lost-items")
public class LostItemController {

    private final LostItemRepository repo;

    public LostItemController(LostItemRepository repo) {
        this.repo = repo;
    }

    // ---------- EXISTING JSON POST (kept as-is) ----------
    @PostMapping
    public LostItem create(@RequestBody LostItem item) {
        return repo.save(item);
    }

    // ---------- NEW MULTIPART POST ----------
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LostItem createMultipart(
            @RequestParam("username") String username,
            @RequestParam("description") String description,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) throws Exception {

        LostItem item = new LostItem();
        item.setUsername(username);
        item.setDescription(description);
        item.setLocation(location);

        if (image != null && !image.isEmpty()) {
            Path uploadDir = Paths.get("lost-uploads");
            Files.createDirectories(uploadDir);

            String original = image.getOriginalFilename() == null ? "" : image.getOriginalFilename();
            String ext = original.contains(".")
                    ? original.substring(original.lastIndexOf("."))
                    : ".jpg";

            String filename = UUID.randomUUID() + ext;
            Path target = uploadDir.resolve(filename);

            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            item.setImagePath("/lost-uploads/" + filename);
        }

        return repo.save(item);
    }

    // ---------- LIST ALL LOST ITEMS (ADMIN) ----------
    @GetMapping
    public List<LostItem> list() {
        return repo.findAll();
    }

    // ---------- GET LOST ITEM BY ID (IMPORTANT FOR MATCH UI) ----------
    @GetMapping("/{id}")
    public ResponseEntity<LostItem> get(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ---------- LIST LOST ITEMS BY USER ----------
    @GetMapping("/user/{username}")
    public List<LostItem> byUser(@PathVariable String username) {
        return repo.findByUsername(username);
    }

    // ---------- DELETE LOST ITEM (and delete image file if present) ----------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        LostItem item = repo.findById(id).orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }

        // delete file if present
        try {
            if (item.getImagePath() != null && !item.getImagePath().isBlank()) {
                // "/lost-uploads/xyz.jpg" -> "lost-uploads/xyz.jpg"
                String relative = item.getImagePath().replaceFirst("^/+", "");
                Path filePath = Paths.get(relative).toAbsolutePath();
                Files.deleteIfExists(filePath);
            }
        } catch (Exception ignored) {}

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
