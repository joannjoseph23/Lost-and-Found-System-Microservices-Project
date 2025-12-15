package com.LostandFound.lost_services.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.LostandFound.lost_services.model.LostItem;
import java.util.List;

public interface LostItemRepository extends JpaRepository<LostItem, String> {
    List<LostItem> findByUsername(String username);
}
