package com.LostandFound.matching_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "FOUND-SERVICES")
public interface FoundClient {
    @GetMapping("/found-items")
    List<Map<String, Object>> getFoundItems();
}
