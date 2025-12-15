package com.LostandFound.auth_service.repo;

import com.LostandFound.auth_service.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, String> {}
