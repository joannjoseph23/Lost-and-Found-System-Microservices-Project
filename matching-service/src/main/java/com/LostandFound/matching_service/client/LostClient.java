package com.LostandFound.matching_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "LOST-SERVICES")
public interface LostClient {
    @GetMapping("/lost-items")
    List<Map<String, Object>> getLostItems();
}
