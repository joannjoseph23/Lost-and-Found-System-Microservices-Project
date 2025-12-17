package com.LostandFound.lost_services.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class LostStaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get("lost-uploads").toAbsolutePath();
        registry.addResourceHandler("/lost-uploads/**")
                .addResourceLocations("file:" + uploadDir.toString() + "/");
    }
}
