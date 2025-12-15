package com.LostandFound.found_services.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LostandFound.found_services.model.FoundItem;

public interface FoundItemRepository extends JpaRepository<FoundItem, String> {}
