package com.LostandFound.found_services.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.LostandFound.found_services.model.FoundItem;
import com.LostandFound.found_services.repo.FoundItemRepository;

@RestController
@RequestMapping("/found-items")
public class FoundItemController {

    private final FoundItemRepository repo;

    public FoundItemController(FoundItemRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FoundItem create(
            @RequestParam("image") MultipartFile image,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "location", required = false) String location
    ) throws Exception {

        // Store image locally
        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);

        String original = image.getOriginalFilename() == null
                ? ""
                : image.getOriginalFilename();

        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf("."))
                : ".jpg";

        String filename = UUID.randomUUID() + ext;
        Path target = uploadDir.resolve(filename);

        Files.copy(
                image.getInputStream(),
                target,
                StandardCopyOption.REPLACE_EXISTING
        );

        FoundItem item = new FoundItem();
        item.setTitle(title);
        item.setDescription(description);
        item.setLocation(location);
        item.setStatus("AVAILABLE");
        item.setImagePath("/uploads/" + filename);

        return repo.save(item);
    }

    @GetMapping
    public List<FoundItem> list() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FoundItem> get(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<FoundItem> update(
            @PathVariable String id,
            @RequestBody FoundItem body
    ) {
        return repo.findById(id)
                .map(existing -> {
                    existing.setTitle(body.getTitle());
                    existing.setDescription(body.getDescription());
                    existing.setLocation(body.getLocation());

                    if (body.getStatus() != null) {
                        existing.setStatus(body.getStatus());
                    }

                    return ResponseEntity.ok(repo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
