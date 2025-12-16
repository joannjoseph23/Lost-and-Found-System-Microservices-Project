package com.LostandFound.found_services.repo;

import com.LostandFound.found_services.model.FoundItem;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class FoundItemRepositoryTest {

    @Autowired FoundItemRepository repo;

    @Test
    void save_and_find() {
        FoundItem item = new FoundItem();
        item.setTitle("Phone");
        item.setStatus("AVAILABLE");

        FoundItem saved = repo.save(item);

        assertThat(saved.getId()).isNotNull();
        assertThat(repo.findById(saved.getId())).isPresent();
    }
}
