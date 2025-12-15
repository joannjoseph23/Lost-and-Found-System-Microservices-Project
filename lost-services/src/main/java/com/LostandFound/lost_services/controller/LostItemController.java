package com.LostandFound.lost_services.controller;

import com.LostandFound.lost_services.model.LostItem;
import com.LostandFound.lost_services.repo.LostItemRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/lost-items")
public class LostItemController {

    private final LostItemRepository repo;

    public LostItemController(LostItemRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public LostItem create(@RequestBody LostItem item) {
        return repo.save(item);
    }

    @GetMapping
    public List<LostItem> list() {
        return repo.findAll();
    }

    @GetMapping("/user/{username}")
    public List<LostItem> byUser(@PathVariable String username) {
        return repo.findByUsername(username);
    }
}
